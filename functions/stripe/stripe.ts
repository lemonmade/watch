import Stripe from 'stripe';
import {redirect, createRequestRouter} from '@quilted/request-router';
import {PrismaClient} from '@prisma/client';
import type {} from '@quilted/cloudflare';

import {SearchParam, PaymentStatus} from '~/global/subscriptions';

import type {EmailQueue} from '../email';

import {SUBSCRIPTION_LEVELS} from '~/global/subscriptions';

interface Environment {
  STRIPE_SECRET: string;
  STRIPE_API_KEY: string;
  DATABASE_URL: string;
  EMAIL_QUEUE: EmailQueue;
}

declare module '@quilted/cloudflare' {
  interface CloudflareRequestEnvironment extends Environment {}
}

const router = createRequestRouter();

router.get('internal/stripe/return', async (request, {env}) => {
  const paymentIntent = request.URL.searchParams.get('payment_intent');

  // TODO
  if (paymentIntent == null) {
    return redirectWithStatus('/app/me', PaymentStatus.Failed);
  }

  const stripe = createStripe(env);

  const foundPaymentIntent = await stripe.paymentIntents.retrieve(
    paymentIntent,
  );

  switch (foundPaymentIntent.status) {
    case 'succeeded': {
      return redirectWithStatus('/app/me', PaymentStatus.Success);
    }
    case 'processing': {
      return redirectWithStatus('/app/me', PaymentStatus.Pending);
    }
    default: {
      return redirectWithStatus('/app/my/payment', PaymentStatus.Failed);
    }
  }

  function redirectWithStatus(to: string, status: PaymentStatus) {
    const url = new URL(to, request.url);
    url.searchParams.set(SearchParam.PaymentStatus, status);
    return redirect(url);
  }
});

router.post('internal/stripe/webhooks', async (request, {env}) => {
  const stripe = createStripe(env);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      request.headers.get('Stripe-Signature') ?? '',
      env.STRIPE_SECRET,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return new Response(null, {status: 400});
  }

  // eslint-disable-next-line no-console
  console.log(event);

  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL,
        },
      },
    });

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
          await prisma.stripeSubscription.findFirstOrThrow({
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

        await env.EMAIL_QUEUE.send({
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
          await prisma.stripeSubscription.findFirstOrThrow({
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

        await env.EMAIL_QUEUE.send({
          type: 'subscriptionCancellation',
          props: {userEmail: user.email},
        });

        break;
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return new Response(null, {status: 400});
  }

  return new Response(null, {status: 200});
});

router.any('internal/stripe/webhooks', () => {
  return new Response(null, {status: 400});
});

export default router;

function createStripe(env: Environment) {
  const stripe = new Stripe(env.STRIPE_API_KEY, {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
  });

  return stripe;
}
