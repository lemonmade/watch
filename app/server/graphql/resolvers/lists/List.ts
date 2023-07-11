import type {
  List as DatabaseList,
  ListItem as DatabaseListItem,
} from '@prisma/client';

import {
  createResolver,
  createResolverWithGid,
  createQueryResolver,
  createMutationResolver,
} from '../shared/resolvers.ts';
import {toGid, fromGid} from '../shared/id.ts';
import {
  addResolvedType,
  createInterfaceResolver,
} from '../shared/interfaces.ts';

declare module '../types.ts' {
  export interface GraphQLValues {
    List: DatabaseList | typeof VIRTUAL_WATCH_LATER_LIST;
    ListItem: DatabaseListItem;
  }
}

export const VIRTUAL_WATCH_LATER_LIST = {
  __imaginaryWatchLater: true,
};

export const Query = createQueryResolver({
  list(_, {id}: {id: string}, {prisma, user}) {
    return prisma.list.findFirst({
      where: {id: fromGid(id).id, userId: user.id},
    });
  },
  async lists(_, __, {user, prisma}) {
    const {watchLaterId} = await prisma.user.findFirst({
      where: {id: user.id},
      rejectOnNotFound: true,
    });

    return prisma.list.findMany({
      where: {
        userId: user.id,
        id: watchLaterId ? {not: watchLaterId} : undefined,
      },
      orderBy: {createdAt: 'desc'},
      take: 50,
    });
  },
});

export const List = createResolver('List', {
  id: (list) =>
    '__imaginaryWatchLater' in list
      ? toGid('watch-later', 'List')
      : toGid(list.id, 'List'),
  items(list, _, {prisma}) {
    if ('__imaginaryWatchLater' in list) return [];

    return prisma.listItem.findMany({
      where: {listId: list.id},
      orderBy: {position: 'asc'},
      take: 50,
    });
  },
});

export const ListItem = createResolverWithGid('ListItem', {
  async media({id, seriesId}, _, {prisma}) {
    const series =
      seriesId == null
        ? null
        : await prisma.series.findFirst({
            where: {id: seriesId},
          });

    if (series == null) {
      throw new Error(`Could not find media for list item ${id}`);
    }

    return addResolvedType('Series')(series);
  },
});

export const Listable = createInterfaceResolver();

export const Series = createResolver('Series', {
  async lists({id}, _, {prisma, user}) {
    const items = await prisma.listItem.findMany({
      where: {
        seriesId: id,
        list: {userId: user.id},
      },
      include: {list: true},
    });

    const seenLists = new Set<string>();
    const lists: DatabaseList[] = [];

    for (const {list} of items) {
      if (seenLists.has(list.id)) continue;
      seenLists.add(list.id);
      lists.push(list);
    }

    return lists;
  },
});

export const Season = createResolver('Season', {
  lists() {
    return [];
  },
});

export const Episode = createResolver('Episode', {
  lists() {
    return [];
  },
});

export const Mutation = createMutationResolver({
  async addToList(_, {id, seriesId}, {user, prisma}) {
    if (seriesId == null) {
      // We will eventually implement storing episodes/ seasons for watching later
      throw new Error(`You must provide a seriesId`);
    }

    const series = await prisma.series.findFirst({
      where: {id: fromGid(seriesId).id},
      rejectOnNotFound: true,
    });

    const list = await prisma.list.findFirst({
      where: {id: fromGid(id).id, userId: user.id},
      include: {
        items: {
          select: {position: true},
          orderBy: {position: 'desc'},
          take: 1,
        },
      },
    });

    if (list == null) {
      throw new Error(`Could not find list with id ${id}`);
    }

    const lastIndex = list.items[list.items.length - 1]?.position ?? -1;

    const item = await prisma.listItem.create({
      data: {position: lastIndex + 1, listId: list.id, seriesId: series.id},
    });

    return {series, list, item};
  },
  async removeFromList(_, {id, itemId}, {user, prisma}) {
    const list = await prisma.list.findFirst({
      where: {id: fromGid(id).id, userId: user.id},
      rejectOnNotFound: true,
    });

    const item = await prisma.listItem.findFirst({
      where: {id: fromGid(itemId).id},
      rejectOnNotFound: true,
    });

    if (item.listId !== list.id) {
      throw new Error(
        `Item with ID ${itemId} is not part of list with ID ${id}`,
      );
    }
    const itemsToShiftInList = await prisma.listItem.findMany({
      where: {listId: list.id, position: {gt: item.position}},
      take: 250,
    });

    const series =
      item.seriesId == null
        ? null
        : await prisma.series.findFirst({
            where: {id: item.seriesId},
            rejectOnNotFound: true,
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
});
