import type {PrismaClient, StripeSubscription} from '@prisma/client';
import type {Stripe} from 'stripe';

import {
  SUBSCRIPTION_LEVELS,
  SubscriptionLevel,
} from '~/global/subscriptions.ts';

import {
  createResolverWithGid,
  createMutationResolver,
} from '../shared/resolvers.ts';

declare module '../types' {
  export interface GraphQLValues {
    Subscription: StripeSubscription;
  }
}

export const Subscription = createResolverWithGid('Subscription', {
  startedAt: ({startedAt}) => startedAt?.toISOString() ?? null,
  endedAt: ({endedAt}) => endedAt?.toISOString() ?? null,
  paymentFlow: ({paymentFlow}, _, {env}) => {
    return paymentFlow
      ? {
          apiKey: env.APP_SECRET_ENCRYPTION_KEY,
          level: (paymentFlow as any).level,
          clientSecret: (paymentFlow as any).clientSecret,
        }
      : null;
  },
});

export const Mutation = createMutationResolver({
  async prepareSubscription(_, {level}, {prisma, user, env}) {
    const {default: Stripe} = await import('stripe');

    const stripe = new Stripe(env.STRIPE_API_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const existingSubscription = await prisma.stripeSubscription.findUnique({
      where: {userId: user.id},
    });

    const {email} = await prisma.user.findUniqueOrThrow({
      where: {id: user.id},
    });

    const price =
      SUBSCRIPTION_LEVELS[level.toUpperCase() as SubscriptionLevel]
        .stripePriceId;

    let subscription = existingSubscription;

    const getSecret = (subscription: Stripe.Subscription) => {
      return (
        (
          (subscription.latest_invoice as Stripe.Invoice)
            ?.payment_intent as Stripe.PaymentIntent
        )?.client_secret ?? undefined
      );
    };

    if (subscription == null) {
      const customer = await stripe.customers.create({
        email,
        metadata: {userId: user.id},
      });

      const stripeSubscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{price}],
        payment_behavior: 'default_incomplete',
        payment_settings: {save_default_payment_method: 'on_subscription'},
        expand: ['latest_invoice.payment_intent'],
        metadata: {level, userId: user.id},
      });

      const secret = getSecret(stripeSubscription);

      const subscription = await prisma.stripeSubscription.create({
        data: {
          level,
          priceId: price,
          userId: user.id,
          customerId: customer.id,
          subscriptionId: stripeSubscription.id,
          paymentFlow: {level, clientSecret: secret},
        },
      });

      await updateUserWithSubscription(subscription, prisma);

      return {subscription};
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.subscriptionId,
      {
        expand: ['latest_invoice.payment_intent'],
      },
    );

    if (
      stripeSubscription.status === 'canceled' ||
      stripeSubscription.status === 'incomplete_expired' ||
      stripeSubscription.items.data[0]?.price.id !== price
    ) {
      const newStripeSubscription = await stripe.subscriptions.create({
        customer: subscription.customerId,
        items: [{price}],
        payment_behavior: 'default_incomplete',
        payment_settings: {save_default_payment_method: 'on_subscription'},
        metadata: {level, userId: user.id},
        expand: ['latest_invoice.payment_intent'],
      });

      const active = newStripeSubscription.status === 'active';

      subscription = await prisma.stripeSubscription.update({
        data: active
          ? {
              level,
              status: 'ACTIVE',
              priceId: price,
              paymentFlow: undefined,
              subscriptionId: newStripeSubscription.id,
              startedAt: new Date(),
              endedAt: undefined,
            }
          : {
              status: 'INACTIVE',
              paymentFlow: {
                level,
                clientSecret: getSecret(newStripeSubscription),
              },
              subscriptionId: newStripeSubscription.id,
            },
        where: {
          id: subscription.id,
        },
      });
    }

    await updateUserWithSubscription(subscription, prisma);

    return {
      subscription,
    };
  },
  async cancelSubscription(_, __, {prisma, user, env}) {
    const subscription = await prisma.stripeSubscription.findUnique({
      where: {userId: user.id},
    });

    if (subscription == null) {
      return {subscription: null};
    }

    const {default: Stripe} = await import('stripe');

    const stripe = new Stripe(env.STRIPE_API_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const cancelResult = await stripe.subscriptions.cancel(
      subscription.subscriptionId,
      {
        prorate: true,
      },
    );

    console.log(cancelResult);

    const updatedSubscription = await prisma.stripeSubscription.update({
      where: {id: subscription.id},
      data: {
        status: 'INACTIVE',
        endedAt: new Date(cancelResult.canceled_at ?? Date.now()),
        paymentFlow: undefined,
      },
    });

    await updateUserWithSubscription(updatedSubscription, prisma);

    return {subscription: updatedSubscription};
  },
});

async function updateUserWithSubscription(
  subscription: StripeSubscription,
  prisma: PrismaClient,
) {
  const user = await prisma.user.findUniqueOrThrow({
    where: {id: subscription.userId},
    include: {giftCodes: {take: 1}},
  });

  const level =
    user.giftCodes.length > 0
      ? user.level
      : subscription.status === 'ACTIVE'
        ? subscription.level
        : 'FREE';

  if (level !== user.level) {
    await prisma.user.update({
      where: {id: user.id},
      data: {level},
    });
  }
}
