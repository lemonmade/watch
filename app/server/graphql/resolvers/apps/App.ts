import type {
  App as DatabaseApp,
  AppInstallation as DatabaseAppInstallation,
} from '@prisma/client';

import {
  addResolvedType,
  createResolver,
  createResolverWithGid,
  createQueryResolver,
  createMutationResolver,
  createUnionResolver,
} from '../shared/resolvers.ts';
import {toHandle} from '../shared/handle.ts';
import {fromGid} from '../shared/id.ts';

declare module '../types' {
  export interface ValueMap {
    App: DatabaseApp;
    AppInstallation: DatabaseAppInstallation;
  }
}

export const Query = createQueryResolver({
  app(_, {id}, {prisma}) {
    return prisma.app.findFirst({where: {id: fromGid(id).id}});
  },
  apps(_, __, {prisma}) {
    return prisma.app.findMany({take: 50});
  },
});

export const Mutation = createMutationResolver({
  async createApp(_, {name, handle}, {prisma, user}) {
    const normalizedHandle = handle ?? toHandle(name);
    const existingAppWithName = await prisma.app.findFirst({
      where: {handle: normalizedHandle, userId: user.id},
    });

    if (existingAppWithName) {
      throw new Error(
        `Existing app found with name ${JSON.stringify(name)} (id: ${
          existingAppWithName.id
        })`,
      );
    }

    const app = await prisma.app.create({
      data: {name, handle: normalizedHandle, userId: user.id},
    });

    return {app};
  },
  async updateApp(_, {id, name}, {prisma}) {
    const app = await prisma.app.update({
      where: {id: fromGid(id).id},
      data: name == null ? {} : {name},
    });

    return {app};
  },
  async deleteApp(_, {id}, {prisma}) {
    // await prisma.app.delete({where: {id: fromGid(id).id}});
    // @see https://github.com/prisma/prisma/issues/2057
    await prisma.$executeRaw`delete from "App" where id=${fromGid(id).id}`;
    return {deletedId: id};
  },
  async installApp(_, {id}, {user, prisma}) {
    const {app, ...installation} = await prisma.appInstallation.create({
      data: {appId: fromGid(id).id, userId: user.id},
      include: {app: true},
    });

    return {app, installation};
  },
});

export const App = createResolverWithGid('App', {
  async extensions({id}, _, {prisma}) {
    const extensions = await prisma.clipsExtension.findMany({
      where: {appId: id},
      take: 50,
      // orderBy: {createAt, 'desc'},
    });

    return extensions.map((extension) =>
      addResolvedType('ClipsExtension', extension),
    );
  },
  async isInstalled({id}, _, {prisma, user}) {
    const installation = await prisma.appInstallation.findFirst({
      where: {appId: id, userId: user.id},
    });

    return installation != null;
  },
});

export const AppInstallation = createResolverWithGid('AppInstallation', {
  app: ({appId}, _, {prisma}) =>
    prisma.app.findFirstOrThrow({where: {id: appId}}),
  async extensions({id}, _, {prisma}) {
    const installations = await prisma.clipsExtensionInstallation.findMany({
      where: {appInstallationId: id},
      take: 50,
      // orderBy: {createAt, 'desc'},
    });

    return installations.map((installation) =>
      addResolvedType('ClipsExtensionInstallation', installation),
    );
  },
});

export const AppExtension = createUnionResolver();

export const AppExtensionInstallation = createUnionResolver();

export const User = createResolver('User', {
  app(_, {id, handle}, {prisma, user}) {
    if (!id && !handle) {
      throw new Error('You must supply either an id or a handle');
    }

    return prisma.app.findFirst({
      where: {
        id: id ? fromGid(id).id : undefined,
        handle: handle || undefined,
        userId: user.id,
      },
    });
  },
  apps(_, __, {prisma, user}) {
    return prisma.app.findMany({take: 50, where: {userId: user.id}});
  },
});
