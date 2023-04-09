import {createHash} from 'crypto';
import type {
  App as DatabaseApp,
  AppInstallation as DatabaseAppInstallation,
  ClipsExtension as DatabaseClipsExtension,
  ClipsExtensionVersion as DatabaseClipsExtensionVersion,
  ClipsExtensionInstallation as DatabaseClipsExtensionInstallation,
} from '@prisma/client';
import Env from '@quilted/quilt/env';
import {type ExtensionPoint} from '@watching/clips';
import {z} from 'zod';

import type {
  ClipsExtensionPointSupportInput,
  CreateClipsInitialVersion,
  ClipsExtensionSettingsStringInput,
} from '../schema.ts';
import {createSignedToken} from '../../shared/auth.ts';

import type {
  Resolver,
  QueryResolver,
  MutationResolver,
  UnionResolver,
  Context,
} from './types.ts';
import {toHandle} from './shared/handle.ts';
import {toGid, fromGid} from './shared/id.ts';
import {createUnionResolver, addResolvedType} from './shared/interfaces.ts';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    UPLOAD_CLIPS_JWT_SECRET: string;
  }
}

declare module './types' {
  export interface ValueMap {
    App: DatabaseApp;
    AppInstallation: DatabaseAppInstallation;
    ClipsExtension: DatabaseClipsExtension;
    ClipsExtensionVersion: DatabaseClipsExtensionVersion;
    ClipsExtensionInstallation: DatabaseClipsExtensionInstallation;
  }
}

export const Query: Pick<
  QueryResolver,
  'app' | 'apps' | 'clipsInstallation' | 'clipsInstallations'
> = {
  app(_, {id}, {prisma}) {
    return prisma.app.findFirst({where: {id: fromGid(id).id}});
  },
  apps(_, __, {prisma}) {
    return prisma.app.findMany({take: 50});
  },
  async clipsInstallations(_, {target, conditions}, {user, prisma}) {
    const installations = await prisma.clipsExtensionInstallation.findMany({
      where: {
        userId: user.id,
        target: target ?? undefined,
        extension: {activeVersion: {status: 'PUBLISHED'}},
      },
      include: {
        extension: {
          select: {activeVersion: {select: {status: true, extends: true}}},
        },
      },
      take: 50,
    });

    const resolvedConditions = await Promise.all(
      conditions?.map(async (condition) => {
        if (condition.series == null) {
          throw new Error(`Unknown condition: ${condition}`);
        }

        if (condition.series.id != null) {
          const series = await prisma.series.findFirst({
            where: {id: fromGid(condition.series.id).id},
            rejectOnNotFound: true,
          });

          return {condition, series};
        }

        if (condition.series.handle != null) {
          const series = await prisma.series.findFirst({
            where: {handle: condition.series.handle},
            rejectOnNotFound: true,
          });

          return {condition, series};
        }

        throw new Error(
          `You must provide either an 'id' or 'handle' (${condition})`,
        );
      }) ?? [],
    );

    return installations.filter((installation) => {
      const version = installation.extension.activeVersion;

      if (version == null || version.status !== 'PUBLISHED') {
        return false;
      }

      return resolvedConditions.every(({series}) => {
        return ((version.extends as any[]) ?? []).some((supports: any) => {
          return (
            target === supports.target &&
            supports.conditions.some(
              (supportCondition: any) =>
                supportCondition.series == null ||
                supportCondition.series.handle === series.handle,
            )
          );
        });
      });
    });
  },
  clipsInstallation(_, {id}, {prisma}) {
    return prisma.clipsExtensionInstallation.findFirst({
      where: {id: fromGid(id).id},
    });
  },
};

export const User: Pick<Resolver<'User'>, 'app' | 'apps'> = {
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
};

const SeriesExtensionPoint = z.enum([
  'Series.Details.RenderAccessory',
] as readonly [ExtensionPoint, ...ExtensionPoint[]]);

export const Series: Pick<Resolver<'Series'>, 'clipsInstallations'> = {
  async clipsInstallations({handle}, {target}, {user, prisma}) {
    if (!SeriesExtensionPoint.safeParse(target).success) {
      throw new Error(`Invalid target: ${target}`);
    }

    const installations = await prisma.clipsExtensionInstallation.findMany({
      where: {
        userId: user.id,
        target,
        extension: {activeVersion: {status: 'PUBLISHED'}},
      },
      include: {
        extension: {
          select: {activeVersion: {select: {status: true, extends: true}}},
        },
      },
      take: 50,
    });

    return installations.filter((installation) => {
      const version = installation.extension.activeVersion;

      if (version == null || version.status !== 'PUBLISHED') {
        return false;
      }

      return (version.extends as any[]).some((supports) => {
        return (
          target === supports.target &&
          supports.conditions.some(
            (supportCondition: any) =>
              supportCondition.series == null ||
              supportCondition.series.handle === handle,
          )
        );
      });
    });
  },
};

const WatchThroughExtensionPoint = z.enum([
  'WatchThrough.Details.RenderAccessory',
] as readonly [ExtensionPoint, ...ExtensionPoint[]]);

export const WatchThrough: Pick<
  Resolver<'WatchThrough'>,
  'clipsInstallations'
> = {
  async clipsInstallations({seriesId}, {target}, {user, prisma}) {
    if (!WatchThroughExtensionPoint.safeParse(target).success) {
      throw new Error(`Invalid target: ${target}`);
    }

    const [series, installations] = await Promise.all([
      prisma.series.findFirstOrThrow({
        where: {id: seriesId},
        select: {handle: true},
      }),
      prisma.clipsExtensionInstallation.findMany({
        where: {
          userId: user.id,
          target,
          extension: {activeVersion: {status: 'PUBLISHED'}},
        },
        include: {
          extension: {
            select: {activeVersion: {select: {status: true, extends: true}}},
          },
        },
        take: 50,
      }),
    ]);

    return installations.filter((installation) => {
      const version = installation.extension.activeVersion;

      if (version == null || version.status !== 'PUBLISHED') {
        return false;
      }

      return (version.extends as any[]).some((supports) => {
        return (
          target === supports.target &&
          supports.conditions.some(
            (supportCondition: any) =>
              supportCondition.series == null ||
              supportCondition.series.handle === series.handle,
          )
        );
      });
    });
  },
};

export const Mutation: Pick<
  MutationResolver,
  | 'createApp'
  | 'updateApp'
  | 'deleteApp'
  | 'installApp'
  | 'createClipsExtension'
  | 'updateClipsExtension'
  | 'deleteClipsExtension'
  | 'pushClipsExtension'
  | 'publishLatestClipsExtensionVersion'
  | 'installClipsExtension'
  | 'uninstallClipsExtension'
  | 'updateClipsExtensionInstallation'
> = {
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
  async createClipsExtension(
    _,
    {name, handle, appId, initialVersion},
    {prisma, request},
  ) {
    const {app, ...extension} = await prisma.clipsExtension.create({
      data: {
        name,
        handle: handle ?? toHandle(name),
        appId: fromGid(appId).id,
      },
      include: {app: true},
    });

    if (initialVersion == null) {
      return {app, extension, version: null, signedScriptUpload: null};
    }

    const {version: versionInput} = await createStagedClipsVersion({
      ...initialVersion,
      id: extension.id,
      appId: fromGid(appId).id,
      extensionName: name,
      request,
    });

    const version = await prisma.clipsExtensionVersion.create({
      data: {...versionInput, extensionId: extension.id, status: 'BUILDING'},
    });

    return {
      app,
      extension,
      version,
    };
  },
  async updateClipsExtension(_, {id, name}, {prisma}) {
    if (name == null) {
      throw new Error();
    }

    const extension = await prisma.clipsExtension.update({
      data: {name},
      where: {id: fromGid(id).id},
      include: {app: true},
    });

    return {extension, app: extension.app};
  },
  async deleteClipsExtension(_, {id}, {prisma}) {
    const {app} = await prisma.clipsExtension.delete({
      where: {id: fromGid(id).id},
      select: {app: true},
    });

    return {deletedId: id, app};
  },
  async pushClipsExtension(
    _,
    {id: extensionId, code, name, translations, extends: supports, settings},
    {prisma, request},
  ) {
    const id = fromGid(extensionId).id;

    const existingVersion = await prisma.clipsExtensionVersion.findFirst({
      where: {extensionId: id, status: 'BUILDING'},
      select: {id: true},
    });

    const extension = await prisma.clipsExtension.findFirst({
      where: {id},
      rejectOnNotFound: true,
    });

    const {version: versionInput} = await createStagedClipsVersion({
      code,
      id,
      appId: extension.appId,
      extensionName: name ?? extension.name,
      translations,
      extends: supports,
      settings,
      request,
    });

    if (existingVersion) {
      const version = await prisma.clipsExtensionVersion.update({
        where: {id: existingVersion.id},
        data: {...versionInput},
      });

      return {
        version,
        extension,
      };
    }

    const version = await prisma.clipsExtensionVersion.create({
      data: {...versionInput, extensionId: id, status: 'BUILDING'},
    });

    return {
      extension,
      version,
    };
  },
  async publishLatestClipsExtensionVersion(_, {id}, {prisma}) {
    const result = await prisma.clipsExtensionVersion.findFirst({
      where: {status: 'BUILDING', extensionId: fromGid(id).id},
      include: {extension: true},
    });

    if (result == null) {
      return {extension: null, version: null};
    }

    const {extension, ...version} = result;

    await prisma.$transaction([
      prisma.clipsExtensionVersion.update({
        where: {id: version.id},
        data: {status: 'PUBLISHED'},
      }),
      prisma.clipsExtension.update({
        where: {id: extension.id},
        data: {activeVersionId: version.id},
      }),
    ]);

    return {
      version,
      extension,
    };
  },
  async installClipsExtension(_, {id, target, settings}, {user, prisma}) {
    const extension = await prisma.clipsExtension.findFirst({
      where: {id: fromGid(id).id},
      include: {
        activeVersion: {select: {extends: true}},
      },
      rejectOnNotFound: true,
    });

    let resolvedExtensionPoint = target;

    if (resolvedExtensionPoint == null) {
      const supports = extension.activeVersion
        ?.extends as any as ClipsExtensionPointSupportInput[];

      if (supports?.length === 1) {
        resolvedExtensionPoint = supports[0]!.target;
      }
    }

    if (resolvedExtensionPoint == null) {
      throw new Error(
        `Could not determine an extension point, you must explicitly provide an target argument`,
      );
    }

    const appInstallation = await prisma.appInstallation.findFirst({
      where: {userId: user.id, appId: extension.appId},
    });

    if (appInstallation == null) {
      throw new Error(`You must install the app for extension ${id} first`);
    }

    const installation = await prisma.clipsExtensionInstallation.create({
      data: {
        userId: user.id,
        extensionId: extension.id,
        target: resolvedExtensionPoint,
        settings: settings == null ? undefined : JSON.parse(settings),
        appInstallationId: appInstallation.id,
      },
    });

    return {
      extension,
      installation,
    };
  },
  async uninstallClipsExtension(_, {id}, {user, prisma}) {
    const installation = await prisma.clipsExtensionInstallation.findFirst({
      where: {id: fromGid(id).id, userId: user.id},
      select: {
        id: true,
        extension: true,
      },
      rejectOnNotFound: true,
    });

    await prisma.clipsExtensionInstallation.delete({
      where: {id: installation.id},
    });

    return {
      deletedInstallationId: installation.id,
      extension: installation.extension,
    };
  },
  async updateClipsExtensionInstallation(_, {id, settings}, {user, prisma}) {
    const installationDetails =
      await prisma.clipsExtensionInstallation.findFirst({
        where: {id: fromGid(id).id},
        select: {id: true, userId: true},
        rejectOnNotFound: true,
      });

    if (installationDetails.userId !== user.id) {
      throw new Error();
    }

    const {extension, ...installation} =
      await prisma.clipsExtensionInstallation.update({
        where: {id: installationDetails.id},
        include: {extension: true},
        data:
          settings == null
            ? {}
            : {
                settings: JSON.parse(settings),
              },
      });

    return {
      extension,
      installation,
    };
  },
};

export const AppExtension = createUnionResolver();

export const AppExtensionInstallation = createUnionResolver();

export const App: Resolver<'App'> = {
  id: ({id}) => toGid(id, 'App'),
  async extensions({id}, _, {prisma}) {
    const extensions = await prisma.clipsExtension.findMany({
      where: {appId: id},
      take: 50,
      // orderBy: {createAt, 'desc'},
    });

    return extensions.map(addResolvedType('ClipsExtension'));
  },
  async isInstalled({id}, _, {prisma, user}) {
    const installation = await prisma.appInstallation.findFirst({
      where: {appId: id, userId: user.id},
    });

    return installation != null;
  },
};

export const AppInstallation: Resolver<'AppInstallation'> = {
  id: ({id}) => toGid(id, 'AppInstallation'),
  app: ({appId}, _, {prisma}) =>
    prisma.app.findFirst({where: {id: appId}, rejectOnNotFound: true}),
  async extensions({id}, _, {prisma}) {
    const installations = await prisma.clipsExtensionInstallation.findMany({
      where: {appInstallationId: id},
      take: 50,
      // orderBy: {createAt, 'desc'},
    });

    return installations.map(addResolvedType('ClipsExtensionInstallation'));
  },
};

export const ClipsExtension: Resolver<'ClipsExtension'> = {
  id: ({id}) => toGid(id, 'ClipsExtension'),
  app: ({appId}, _, {prisma}) =>
    prisma.app.findFirst({where: {id: appId}, rejectOnNotFound: true}),
  latestVersion({activeVersionId}, _, {prisma}) {
    return activeVersionId
      ? prisma.clipsExtensionVersion.findFirst({where: {id: activeVersionId}})
      : null;
  },
  async versions({id}, _, {prisma}) {
    const versions = await prisma.clipsExtensionVersion.findMany({
      where: {extensionId: id},
      take: 50,
      // orderBy: {createAt, 'desc'},
    });

    return versions;
  },
  async isInstalled({id}, _, {prisma, user}) {
    const installation = await prisma.clipsExtensionInstallation.findFirst({
      where: {extensionId: id, userId: user.id},
    });

    return installation != null;
  },
};

export const ClipsExtensionVersion: Resolver<'ClipsExtensionVersion'> = {
  id: ({id}) => toGid(id, 'ClipsExtensionVersion'),
  extension: ({extensionId}, _, {prisma}) =>
    prisma.clipsExtension.findFirst({
      where: {id: extensionId},
      rejectOnNotFound: true,
    }),
  assets: ({scriptUrl}) => (scriptUrl ? [{source: scriptUrl}] : []),
  translations: ({translations}) =>
    translations ? JSON.stringify(translations) : null,
  extends: ({extends: supports}) => (supports as any) ?? [],
  settings: ({settings}) => (settings as any) ?? {fields: []},
};

export const ClipsExtensionPointSupportCondition: UnionResolver = {
  __resolveType(condition: {type: string}) {
    switch (condition.type) {
      case 'series':
        return 'ClipsExtensionPointSupportSeriesCondition';
    }

    throw new Error(`Unknown condition: ${condition}`);
  },
};

export const ClipsExtensionSettingsString: UnionResolver = {
  __resolveType(stringType: {type: string}) {
    switch (stringType.type) {
      case 'static':
        return 'ClipsExtensionSettingsStringStatic';
      case 'translation':
        return 'ClipsExtensionSettingsStringTranslation';
    }

    throw new Error(`Unknown stringType: ${stringType}`);
  },
};

export const ClipsExtensionSettingsField: UnionResolver = {
  __resolveType(settingsField: {type: string}) {
    switch (settingsField.type) {
      case 'string':
        return 'ClipsExtensionSettingsStringField';
      case 'number':
        return 'ClipsExtensionSettingsNumberField';
      case 'options':
        return 'ClipsExtensionSettingsOptionsField';
    }

    throw new Error(`Unknown settings field: ${settingsField}`);
  },
};

export const ClipsExtensionInstallation: Resolver<'ClipsExtensionInstallation'> =
  {
    id: ({id}) => toGid(id, 'ClipsExtensionInstallation'),
    extension: ({extensionId}, _, {prisma}) =>
      prisma.clipsExtension.findFirst({
        where: {id: extensionId},
        rejectOnNotFound: true,
      }),
    appInstallation: ({appInstallationId}, _, {prisma}) =>
      prisma.appInstallation.findFirst({
        where: {id: appInstallationId},
        rejectOnNotFound: true,
      }),
    async version({extensionId}, _, {prisma}) {
      const extension = await prisma.clipsExtension.findFirstOrThrow({
        where: {id: extensionId},
        select: {activeVersion: true},
      });

      return extension.activeVersion!;
    },
    async liveQuery({target, extensionId}, _, {prisma}) {
      const extension = await prisma.clipsExtension.findFirstOrThrow({
        where: {id: extensionId},
        select: {activeVersion: true},
      });

      const extend = (extension.activeVersion?.extends ?? []) as any[];

      return extend.find((extend) => extend.target === target)?.liveQuery;
    },
    settings: ({settings}) => (settings ? JSON.stringify(settings) : null),
  };

async function createStagedClipsVersion({
  code,
  appId,
  extensionName,
  translations,
  extends: supports,
  request,
  settings,
}: {
  id: string;
  code: string;
  appId: string;
  request: Context['request'];
  extensionName: string;
} & CreateClipsInitialVersion) {
  const hash = createHash('sha256').update(code).digest('hex');
  const path = `assets/clips/${appId}/${toParam(extensionName)}.${hash}.js`;

  const token = await createSignedToken(
    {path, code},
    {
      secret: Env.UPLOAD_CLIPS_JWT_SECRET,
      expiresIn: '5m',
    },
  );

  const putResult = await fetch(
    new URL('/internal/upload/clips', request.url),
    {
      method: 'PUT',
      body: token,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!putResult.ok) {
    throw new Error(`Could not upload clips: '${await putResult.text()}'`);
  }

  const version: Omit<
    import('@prisma/client').Prisma.ClipsExtensionVersionCreateWithoutExtensionInput,
    'status'
  > = {
    scriptUrl: `https://watch.lemon.tools/${path}`,
    apiVersion: 'UNSTABLE',
    translations: translations && JSON.parse(translations),
    extends:
      supports &&
      (supports.map(({target, liveQuery, conditions}) => {
        return {
          target,
          liveQuery,
          conditions: conditions?.map((condition) => {
            if (condition?.series?.handle == null) {
              throw new Error(`Unknown condition: ${condition}`);
            }

            return condition;
          }),
        };
      }) as any),
    settings: settings?.fields
      ? {
          fields: settings.fields?.map(
            ({
              string: stringField,
              number: numberField,
              options: optionsField,
            }) => {
              if (stringField) {
                const {key, label, default: defaultValue} = stringField;

                return {
                  type: 'string',
                  key,
                  default: defaultValue,
                  label: normalizeClipsString(label),
                };
              }

              if (numberField) {
                const {key, label, default: defaultValue} = numberField;

                return {
                  type: 'number',
                  key,
                  default: defaultValue,
                  label: normalizeClipsString(label),
                };
              }

              if (optionsField) {
                const {
                  key,
                  label,
                  options,
                  default: defaultValue,
                } = optionsField;
                return {
                  type: 'options',
                  key,
                  default: defaultValue,
                  label: normalizeClipsString(label),
                  options: options.map(({label, value}) => ({
                    value,
                    label: normalizeClipsString(label),
                  })),
                };
              }
            },
          ) as any,
        }
      : undefined,
  };

  return {version};
}

function normalizeClipsString({
  static: staticString,
  translation,
}: ClipsExtensionSettingsStringInput) {
  if (staticString) {
    return {type: 'static', value: staticString};
  }

  if (translation) {
    return {type: 'translation', key: translation};
  }

  throw new Error();
}

function toParam(name: string) {
  return name.trim().toLocaleLowerCase().replace(/\s+/g, '-');
}
