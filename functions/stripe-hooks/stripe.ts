import type {Stripe} from 'stripe';
import {RedirectResponse, RequestRouter} from '@quilted/request-router';
import type {Service, Rpc} from '@cloudflare/workers-types';
import type {} from '@quilted/cloudflare';
import {createFetchHandler} from '@quilted/cloudflare/request-router';

import {
  SearchParam,
  PaymentStatus,
  SUBSCRIPTION_LEVELS,
} from '~/global/subscriptions.ts';
import {createEdgeDatabaseConnection} from '~/global/database.ts';

import type {EmailService} from '../email';

interface Environment {
  STRIPE_SECRET: string;
  STRIPE_API_KEY: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  EMAIL_SERVICE: Service<EmailService & Rpc.WorkerEntrypointBranded>;
}

declare module '@quilted/cloudflare' {
  interface CloudflareRequestEnvironment extends Environment {}
}

const router = new RequestRouter();

router.get('internal/stripe/return', async (request, {env}) => {
  const paymentIntent = request.URL.searchParams.get('payment_intent');

  // TODO
  if (paymentIntent == null) {
    return new RedirectWithStatusResponse('/app/me', PaymentStatus.Failed);
  }

  const stripe = await createStripe(env);

  const foundPaymentIntent =
    await stripe.paymentIntents.retrieve(paymentIntent);

  switch (foundPaymentIntent.status) {
    case 'succeeded': {
      return new RedirectWithStatusResponse('/app/me', PaymentStatus.Success);
    }
    case 'processing': {
      return new RedirectWithStatusResponse('/app/me', PaymentStatus.Pending);
    }
    default: {
      return new RedirectWithStatusResponse(
        '/app/my/payment',
        PaymentStatus.Failed,
      );
    }
  }
});

class RedirectWithStatusResponse extends RedirectResponse {
  constructor(to: string, status: PaymentStatus) {
    const url = new URL(to);
    url.searchParams.set(SearchParam.PaymentStatus, status);
    super(url);
  }
}

router.post('internal/stripe/webhooks', async (request, {env}) => {
  const stripe = await createStripe(env);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      request.headers.get('Stripe-Signature') ?? '',
      env.STRIPE_SECRET,
    );
  } catch (error) {
    console.error(error);
    return new Response(null, {status: 400});
  }

  console.log(event);

  const prisma = await createEdgeDatabaseConnection({url: env.DATABASE_URL});

  try {
    // @see https://stripe.com/docs/webhooks/stripe-events
    // @see https://stripe.com/docs/api/subscriptions
    // @see https://stripe.com/docs/billing/subscriptions/build-subscriptions
    // @see https://stripe.com/docs/billing/subscriptions/overview#subscription-events
    switch (event.type) {
      case 'invoice.paid': {
        // TODO
        break;
      }
      case 'invoice.payment_failed': {
        // TODO
        break;
      }
      case 'customer.subscription.updated': {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const priceId = stripeSubscription.items.data[0]?.price.id;
        const active = stripeSubscription.status === 'active';

        const level = Object.values(SUBSCRIPTION_LEVELS).find(
          (level) => level.stripePriceId === priceId,
        );

        if (level == null) {
          throw new Error(`Unknown price: ${priceId}`);
        }

        const {user, ...subscription} =
          await prisma.stripeSubscription.findUniqueOrThrow({
            where: {subscriptionId: stripeSubscription.id},
            include: {user: {include: {giftCodes: {take: 1}}}},
          });

        await prisma.$transaction([
          prisma.stripeSubscription.update({
            where: {id: subscription.id},
            data: {
              level: level.id,
              priceId,
              subscriptionId: stripeSubscription.id,
              customerId: stripeSubscription.customer as string,
              status: active ? 'ACTIVE' : 'INACTIVE',
              paymentFlow: undefined,
              startedAt:
                active && subscription.status !== 'ACTIVE'
                  ? new Date()
                  : subscription.startedAt,
              endedAt: active ? undefined : subscription.endedAt,
            },
          }),
          prisma.user.update({
            where: {id: user.id},
            data: {
              level:
                user.giftCodes.length > 0
                  ? user.level
                  : active
                    ? level.id
                    : 'FREE',
            },
          }),
        ]);

        await env.EMAIL_SERVICE.send({
          type: 'subscriptionConfirmation',
          props: {
            userEmail: user.email,
          },
        });

        break;
      }
      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object as Stripe.Subscription;

        const {user, ...subscription} =
          await prisma.stripeSubscription.findUniqueOrThrow({
            where: {subscriptionId: stripeSubscription.id},
            include: {user: {include: {giftCodes: {take: 1}}}},
          });

        if (event.request == null) {
          // handle a subscription canceled by our own code
        } else {
          await prisma.$transaction([
            prisma.stripeSubscription.update({
              where: {id: subscription.id},
              data: {
                status: 'INACTIVE',
                paymentFlow: undefined,
                endedAt: new Date(),
              },
            }),
            prisma.user.update({
              where: {id: user.id},
              data: {
                level: user.giftCodes.length > 0 ? user.level : 'FREE',
              },
            }),
          ]);
        }

        await env.EMAIL_SERVICE.send({
          type: 'subscriptionCancellation',
          props: {
            userEmail: user.email,
          },
        });

        break;
      }
    }
  } catch (error) {
    console.error(error);
    return new Response(null, {status: 400});
  }

  return new Response(null, {status: 200});
});

router.any('internal/stripe/webhooks', () => {
  return new Response(null, {status: 400});
});

export default {
  fetch: createFetchHandler(router),
};

async function createStripe(env: Environment) {
  const {Stripe} = await import('stripe');

  const stripe = new Stripe(env.STRIPE_API_KEY, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  return stripe;
}
