import type {
  Series as GraphQLSeries,
  WatchLaterPayload,
  RemoveFromWatchLaterPayload,
} from '../graph/schema';

import type {Context, QueryResolver, MutationResolver, Resolver} from './types';
import {toGid, fromGid} from './utilities/id';

import {VIRTUAL_WATCH_LATER_LIST} from './lists';

declare module './types' {
  export interface GraphQLTypeMap {
    WatchLaterPayload: LiteralGraphQLObjectType<WatchLaterPayload>;
    RemoveFromWatchLaterPayload: LiteralGraphQLObjectType<RemoveFromWatchLaterPayload>;
  }
}

export const Query: Pick<QueryResolver, 'watchLater'> = {
  async watchLater(_, __, {user, prisma}) {
    const list = await prisma.list.findFirst({
      where: {watchLaterUser: {id: user.id}},
    });

    return list ?? VIRTUAL_WATCH_LATER_LIST;
  },
};

export const Series: Pick<Resolver<'Series', GraphQLSeries>, 'inWatchLater'> = {
  async inWatchLater({id}, _, {prisma, user}) {
    const item = await prisma.listItem.findFirst({
      where: {
        seriesId: id,
        list: {watchLaterUser: {id: user.id}},
      },
    });

    return item != null;
  },
};

export const Mutation: Pick<
  MutationResolver,
  'watchLater' | 'removeFromWatchLater'
> = {
  async watchLater(_, {seriesId}, {user, prisma}) {
    if (seriesId == null) {
      // We will eventually implement storing episodes/ seasons for watching later
      throw new Error(`You must provide a seriesId`);
    }

    const {series, list, item} = await addSeriesToWatchLater(
      fromGid(seriesId).id,
      {
        user,
        prisma,
      },
    );

    return {series, list, item};
  },
  async removeFromWatchLater(_, {seriesId}, {user, prisma}) {
    if (seriesId == null) {
      // We will eventually implement storing episodes/ seasons for watching later
      throw new Error(`You must provide a seriesId`);
    }

    const series = await prisma.series.findFirst({
      where: {id: fromGid(seriesId).id},
      rejectOnNotFound: true,
    });

    const list =
      (await prisma.list.findFirst({
        where: {
          watchLaterUser: {id: user.id},
        },
        include: {
          items: {
            select: {position: true},
            orderBy: {position: 'desc'},
            take: 1,
          },
        },
      })) ??
      (await prisma.list.create({
        data: {
          userId: user.id,
          watchLaterUser: {connect: {id: user.id}},
        },
        include: {
          items: {
            select: {position: true},
            orderBy: {position: 'desc'},
            take: 1,
          },
        },
      }));

    const item = await prisma.listItem.findFirst({
      where: {listId: list.id, seriesId: series.id},
      rejectOnNotFound: true,
    });

    const itemsToShiftInList = await prisma.listItem.findMany({
      where: {listId: list.id, position: {gt: item.position}},
      take: 250,
    });

    await prisma.$transaction([
      prisma.listItem.delete({
        where: {id: item.id},
      }),
      ...itemsToShiftInList.map((itemToShift) =>
        prisma.listItem.update({
          data: {position: itemToShift.position - 1},
          where: {id: itemToShift.id},
        }),
      ),
    ]);

    return {series, list, removedListItemId: toGid(item.id, 'ListItem')};
  },
};

export async function addSeriesToWatchLater(
  id: string,
  {prisma, user}: Pick<Context, 'prisma' | 'user'>,
) {
  const series = await prisma.series.findFirst({
    where: {id},
    rejectOnNotFound: true,
  });

  const list =
    (await prisma.list.findFirst({
      where: {
        watchLaterUser: {id: user.id},
      },
      include: {
        items: {
          select: {position: true},
          orderBy: {position: 'desc'},
          take: 1,
        },
      },
    })) ??
    (await prisma.list.create({
      data: {
        userId: user.id,
        watchLaterUser: {connect: {id: user.id}},
      },
      include: {
        items: {
          select: {position: true},
          orderBy: {position: 'desc'},
          take: 1,
        },
      },
    }));

  let item = await prisma.listItem.findFirst({
    where: {listId: list.id, seriesId: series.id},
  });

  if (item == null) {
    const lastIndex = list.items[list.items.length - 1]?.position ?? -1;

    item = await prisma.listItem.create({
      data: {position: lastIndex + 1, listId: list.id, seriesId: series.id},
    });
  }

  return {series, list, item};
}
