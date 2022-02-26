import type {
  List as DatabaseList,
  ListItem as DatabaseListItem,
} from '@prisma/client';

import type {
  List as GraphQLList,
  ListItem as GraphQLListItem,
  Series as GraphQLSeries,
  Season as GraphQLSeason,
  Episode as GraphQLEpisode,
  AddToListPayload,
  RemoveFromListPayload,
} from '../graph/schema';

import type {QueryResolver, MutationResolver, Resolver} from './types';
import {toGid, fromGid} from './utilities/id';
import {addResolvedType, createInterfaceResolver} from './utilities/interfaces';

declare module './types' {
  export interface GraphQLTypeMap {
    List: DatabaseList | typeof VIRTUAL_WATCH_LATER_LIST;
    ListItem: DatabaseListItem;
    Listable:
      | GraphQLTypeMap['Series']
      | GraphQLTypeMap['Season']
      | GraphQLTypeMap['Episode'];
    AddToListPayload: LiteralGraphQLObjectType<AddToListPayload>;
    RemoveFromListPayload: LiteralGraphQLObjectType<RemoveFromListPayload>;
  }
}

export const VIRTUAL_WATCH_LATER_LIST = {
  __imaginaryWatchLater: true,
};

export const Query: Pick<QueryResolver, 'list' | 'lists'> = {
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
};

export const List: Resolver<'List', GraphQLList> = {
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
};

export const ListItem: Resolver<'ListItem', GraphQLListItem> = {
  id: ({id}) => toGid(id, 'ListItem'),
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
};

export const Listable = createInterfaceResolver();

export const Series: Pick<Resolver<'Series', GraphQLSeries>, 'lists'> = {
  async lists({id}, _, {prisma, user}) {
    const items = await prisma.listItem.findMany({
      where: {
        seriesId: id,
        list: {userId: user.id},
      },
      include: {list: true},
    });

    const seenLists = new Set<string>();
    const lists: import('@prisma/client').List[] = [];

    for (const {list} of items) {
      if (seenLists.has(list.id)) continue;
      seenLists.add(list.id);
      lists.push(list);
    }

    return lists;
  },
};

export const Season: Pick<Resolver<'Season', GraphQLSeason>, 'lists'> = {
  lists() {
    return [];
  },
};

export const Episode: Pick<Resolver<'Episode', GraphQLEpisode>, 'lists'> = {
  lists() {
    return [];
  },
};

export const Mutation: Pick<MutationResolver, 'addToList' | 'removeFromList'> =
  {
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
  };
