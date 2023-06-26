import type {SeriesSubscription as DatabaseSeriesSubscription} from '@prisma/client';

import {
  createResolver,
  createResolverWithGid,
  createQueryResolver,
  createMutationResolver,
} from '../shared/resolvers.ts';
import {fromGid} from '../shared/id.ts';

declare module '../types.ts' {
  export interface ValueMap {
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
        await prisma.user.findFirst({
          where: {id: user.id},
          rejectOnNotFound: true,
        })
      ).spoilerAvoidance;

    const subscription = await prisma.seriesSubscription.create({
      data: {seriesId: fromGid(id).id, userId: user.id, spoilerAvoidance},
    });

    return {subscription};
  },
  async unsubscribeFromSeries(_, {id: gid}: {id: string}, {user, prisma}) {
    const {id, type} = fromGid(gid);

    const {id: validatedId} = await prisma.seriesSubscription.findFirst({
      where:
        type === 'Series'
          ? {seriesId: id, userId: user.id}
          : {
              id,
              userId: user.id,
            },
      rejectOnNotFound: true,
    });

    await prisma.seriesSubscription.delete({
      where: {id: validatedId},
    });

    return {deletedSubscriptionId: validatedId};
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

    const data: Parameters<
      typeof prisma['seriesSubscription']['update']
    >[0]['data'] = {};

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
    return prisma.series.findFirst({
      where: {id: seriesId},
      rejectOnNotFound: true,
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
