import type {
  Prisma,
  SeriesSubscription as DatabaseSeriesSubscription,
} from '@prisma/client';

import {
  createResolver,
  createResolverWithGid,
  createQueryResolver,
  createMutationResolver,
} from '../shared/resolvers.ts';
import {fromGid} from '../shared/id.ts';

declare module '../types.ts' {
  export interface GraphQLValues {
    SeriesSubscription: DatabaseSeriesSubscription;
  }
}

export const Query = createQueryResolver({
  subscription(_, {id}, {prisma, user}) {
    return prisma.seriesSubscription.findFirst({
      where: {id: fromGid(id).id, userId: user.id},
    });
  },
  subscriptions(_, __, {user, prisma}) {
    return prisma.seriesSubscription.findMany({
      where: {userId: user.id},
      orderBy: {createdAt: 'desc'},
      take: 50,
    });
  },
});

export const Mutation = createMutationResolver({
  async subscribeToSeries(
    _,
    {id, spoilerAvoidance: explicitSpoilerAvoidance},
    {user, prisma},
  ) {
    const spoilerAvoidance =
      explicitSpoilerAvoidance ??
      (
        await prisma.user.findFirstOrThrow({
          where: {id: user.id},
        })
      ).spoilerAvoidance;

    const seriesId = fromGid(id).id;

    const subscription = await prisma.seriesSubscription.upsert({
      where: {seriesId_userId: {seriesId, userId: user.id}},
      create: {seriesId, userId: user.id, spoilerAvoidance},
      update: explicitSpoilerAvoidance
        ? {spoilerAvoidance: explicitSpoilerAvoidance}
        : {},
    });

    return {subscription};
  },
  async toggleSubscriptionToSeries(
    _,
    {id, spoilerAvoidance: explicitSpoilerAvoidance},
    {user, prisma},
  ) {
    const seriesId = fromGid(id).id;
    const existingSubscription = await prisma.seriesSubscription.findFirst({
      where: {seriesId, userId: user.id},
    });

    if (existingSubscription) {
      await prisma.seriesSubscription.delete({
        where: {id: existingSubscription.id},
      });

      return {subscription: null};
    }

    const spoilerAvoidance =
      explicitSpoilerAvoidance ??
      (
        await prisma.user.findFirstOrThrow({
          where: {id: user.id},
        })
      ).spoilerAvoidance;

    const subscription = await prisma.seriesSubscription.create({
      data: {seriesId, userId: user.id, spoilerAvoidance},
    });

    return {subscription};
  },
  async unsubscribeFromSeries(_, {id: gid}: {id: string}, {user, prisma}) {
    const {id, type} = fromGid(gid);

    const subscription = await prisma.seriesSubscription.findFirst({
      where:
        type === 'Series'
          ? {seriesId: id, userId: user.id}
          : {
              id,
              userId: user.id,
            },
    });

    if (subscription == null) {
      return {
        errors: [
          {
            code: 'GENERIC_ERROR',
            message: `No subscription for series ${id} found.`,
          },
        ],
      };
    }

    const {id: validatedId} = subscription;

    await prisma.seriesSubscription.delete({
      where: {id: validatedId},
    });

    return {errors: []};
  },
  async updateSeriesSubscriptionSettings(
    _,
    {id: gid, spoilerAvoidance},
    {user, prisma},
  ) {
    const {id, type} = fromGid(gid);

    const subscriptionForUser = await prisma.seriesSubscription.findFirst({
      select: {id: true},
      where:
        type === 'Series'
          ? {seriesId: id, userId: user.id}
          : {
              id,
              userId: user.id,
            },
    });

    if (subscriptionForUser == null) {
      return {subscription: null};
    }

    const data: Prisma.SeriesSubscriptionUncheckedUpdateInput = {};

    if (spoilerAvoidance != null) {
      data.spoilerAvoidance = spoilerAvoidance;
    }

    const subscription = await prisma.seriesSubscription.update({
      data,
      where: {
        id: subscriptionForUser.id,
      },
    });

    return {subscription};
  },
});

export const SeriesSubscription = createResolverWithGid('SeriesSubscription', {
  subscribedOn: ({createdAt}) => createdAt.toISOString(),
  series({seriesId}, _, {prisma}) {
    return prisma.series.findFirstOrThrow({
      where: {id: seriesId},
    });
  },
  settings({spoilerAvoidance}) {
    return {
      spoilerAvoidance,
    };
  },
});

export const Series = createResolver('Series', {
  subscription({id}, _, {prisma, user}) {
    return prisma.seriesSubscription.findFirst({
      where: {seriesId: id, userId: user.id},
    });
  },
});
