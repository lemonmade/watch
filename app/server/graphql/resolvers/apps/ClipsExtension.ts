import {createHash} from 'crypto';
import type {
  Series as DatabaseSeries,
  ClipsExtension as DatabaseClipsExtension,
  ClipsExtensionVersion as DatabaseClipsExtensionVersion,
  ClipsExtensionInstallation as DatabaseClipsExtensionInstallation,
} from '@prisma/client';
import Env from '@quilted/quilt/env';
import {z} from 'zod';

import type {
  ClipsExtensionPointSupportInput,
  ClipsExtensionPointSupportConditionInput,
  CreateClipsInitialVersion,
  ClipsExtensionSettingsStringInput,
} from '../../schema.ts';
import {createSignedToken} from '../../../shared/auth.ts';

import {
  createMutationResolver,
  createQueryResolver,
  createResolver,
  createResolverWithGid,
  type UnionResolver,
  type ResolverContext,
} from '../shared/resolvers.ts';
import {toHandle} from '../shared/handle.ts';
import {toGid, fromGid} from '../shared/id.ts';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    UPLOAD_CLIPS_JWT_SECRET: string;
  }
}

declare module '../types' {
  export interface GraphQLValues {
    ClipsExtension: DatabaseClipsExtension;
    ClipsExtensionVersion: DatabaseClipsExtensionVersion;
    ClipsExtensionInstallation: DatabaseClipsExtensionInstallation;
  }
}

export const Query = createQueryResolver({
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

    if (installations.length === 0) return [];

    const resolvedConditions = await resolveConditions(conditions, {prisma});

    return filterInstallations(installations, {
      target,
      conditions: resolvedConditions,
    });
  },
  clipsInstallation(_, {id}, {prisma}) {
    return prisma.clipsExtensionInstallation.findFirst({
      where: {id: fromGid(id).id},
    });
  },
});

export const Mutation = createMutationResolver({
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

    const extension = await prisma.clipsExtension.findFirstOrThrow({
      where: {id},
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
    const extension = await prisma.clipsExtension.findFirstOrThrow({
      where: {id: fromGid(id).id},
      include: {
        activeVersion: {select: {extends: true}},
      },
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
    const installation =
      await prisma.clipsExtensionInstallation.findFirstOrThrow({
        where: {id: fromGid(id).id, userId: user.id},
        select: {
          id: true,
          extension: true,
        },
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
      await prisma.clipsExtensionInstallation.findFirstOrThrow({
        where: {id: fromGid(id).id},
        select: {id: true, userId: true},
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
});

export const ClipsExtension = createResolverWithGid('ClipsExtension', {
  app: ({appId}, _, {prisma}) =>
    prisma.app.findFirstOrThrow({where: {id: appId}}),
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
});

export const ClipsExtensionVersion = createResolverWithGid(
  'ClipsExtensionVersion',
  {
    extension: ({extensionId}, _, {prisma}) =>
      prisma.clipsExtension.findFirstOrThrow({
        where: {id: extensionId},
      }),
    assets: ({scriptUrl}) => (scriptUrl ? [{source: scriptUrl}] : []),
    translations: ({translations}) =>
      translations ? JSON.stringify(translations) : null,
    extends: ({extends: supports}) => (supports as any) ?? [],
    settings: ({settings}) => (settings as any) ?? {fields: []},
  },
);

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

export const ClipsExtensionInstallation = createResolverWithGid(
  'ClipsExtensionInstallation',
  {
    id: ({id}) => toGid(id, 'ClipsExtensionInstallation'),
    extension: ({extensionId}, _, {prisma}) =>
      prisma.clipsExtension.findFirstOrThrow({
        where: {id: extensionId},
      }),
    appInstallation: ({appInstallationId}, _, {prisma}) =>
      prisma.appInstallation.findFirstOrThrow({
        where: {id: appInstallationId},
      }),
    async version({extensionId}, _, {prisma}) {
      const extension = await prisma.clipsExtension.findFirstOrThrow({
        where: {id: extensionId},
        select: {activeVersion: true},
      });

      return extension.activeVersion!;
    },
    async translations({extensionId}, _, {prisma}) {
      const extension = await prisma.clipsExtension.findFirstOrThrow({
        where: {id: extensionId},
        select: {activeVersion: true},
      });

      const translations = extension.activeVersion?.translations;

      return translations ? JSON.stringify(translations) : null;
    },
    async liveQuery({target, extensionId}, _, {prisma}) {
      const extension = await prisma.clipsExtension.findFirstOrThrow({
        where: {id: extensionId},
        select: {activeVersion: true},
      });

      const extend = (extension.activeVersion?.extends ?? []) as any[];

      return extend.find((extend) => extend.target === target)?.liveQuery;
    },
    async loading({target, extensionId}, _, {prisma}) {
      const extension = await prisma.clipsExtension.findFirstOrThrow({
        where: {id: extensionId},
        select: {activeVersion: true},
      });

      const extend = (extension.activeVersion?.extends ?? []) as any[];

      const loading = extend.find((extend) => extend.target === target)
        ?.loading;

      if (loading == null) return null;

      const {parseLoadingHtml} = await import('@watching/tools/loading');

      return {
        ui: loading?.ui
          ? {
              html: loading.ui,
              tree: JSON.stringify(parseLoadingHtml(loading.ui)),
            }
          : null,
      };
    },
    settings: ({settings}) => (settings ? JSON.stringify(settings) : null),
  },
);

const SeriesExtensionPoint = z.enum(['series.details.accessory']);

export const Series = createResolver('Series', {
  async clipsInstallations(series, {target}, {user, prisma}) {
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

    if (installations.length === 0) return [];

    return filterInstallations(installations, {
      target,
      conditions: [
        {
          series,
          condition: {series: {handle: series.handle}},
        },
      ],
    });
  },
});

const WatchThroughExtensionPoint = z.enum(['watch-through.details.accessory']);

export const WatchThrough = createResolver('WatchThrough', {
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

    if (installations.length === 0) return [];

    return filterInstallations(installations, {
      target,
      conditions: [
        {
          series,
          condition: {series: {handle: series.handle}},
        },
      ],
    });
  },
});

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
  extensionName: string;
} & Pick<ResolverContext, 'request'> &
  CreateClipsInitialVersion) {
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
      // @see https://github.com/nodejs/node/issues/46221
      ...{duplex: 'half'},
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
    extends: supports
      ? await Promise.all(
          supports.map(async ({target, liveQuery, loading, conditions}) => {
            return {
              target,
              liveQuery: liveQuery
                ? await (async () => {
                    const [
                      {parse},
                      {toGraphQLOperation, cleanGraphQLDocument},
                    ] = await Promise.all([
                      import('graphql'),
                      import('@quilted/graphql-tools'),
                    ]);

                    return toGraphQLOperation(
                      cleanGraphQLDocument(parse(liveQuery)),
                    ).source;
                  })()
                : undefined,
              loading: loading?.ui
                ? {
                    ui: await (async () => {
                      const {parseLoadingHtml, serializeLoadingHtml} =
                        await import('@watching/tools/loading');

                      return serializeLoadingHtml(
                        parseLoadingHtml(loading.ui!),
                      );
                    })(),
                  }
                : undefined,
              conditions: conditions?.map((condition) => {
                if (condition?.series?.handle == null) {
                  throw new Error(`Unknown condition: ${condition}`);
                }

                return condition;
              }),
            };
          }) as any,
        )
      : [],
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

interface ResolvedCondition {
  series: Pick<DatabaseSeries, 'handle'>;
  condition: ClipsExtensionPointSupportConditionInput;
}

async function resolveConditions(
  conditions: ClipsExtensionPointSupportConditionInput[] | undefined | null,
  {prisma}: Pick<ResolverContext, 'prisma'>,
): Promise<ResolvedCondition[]> {
  const resolvedConditions = await Promise.all(
    conditions?.map(async (condition) => {
      if (condition.series == null) {
        throw new Error(`Unknown condition: ${condition}`);
      }

      if (condition.series.id != null) {
        const series = await prisma.series.findFirstOrThrow({
          where: {id: fromGid(condition.series.id).id},
        });

        return {condition, series};
      }

      if (condition.series.handle != null) {
        const series = await prisma.series.findFirstOrThrow({
          where: {handle: condition.series.handle},
        });

        return {condition, series};
      }

      throw new Error(
        `You must provide either an 'id' or 'handle' (${condition})`,
      );
    }) ?? [],
  );

  return resolvedConditions;
}

function filterInstallations(
  installations: (DatabaseClipsExtensionInstallation & {
    extension: {
      activeVersion: Pick<
        DatabaseClipsExtensionVersion,
        'status' | 'extends'
      > | null;
    };
  })[],
  {
    target,
    conditions,
  }: {
    target?: string | null;
    conditions: ResolvedCondition[];
  },
) {
  return installations.filter((installation) => {
    const version = installation.extension.activeVersion;

    if (version == null || version.status !== 'PUBLISHED') {
      return false;
    }

    const extensionPoints =
      (version.extends as {
        target: string;
        conditions?: {series?: {handle?: string}}[];
      }[]) ?? [];

    return extensionPoints.some((extensionPoint) => {
      if (target != null && target !== extensionPoint.target) {
        return false;
      }

      if (
        extensionPoint.conditions == null ||
        extensionPoint.conditions.length === 0
      ) {
        return true;
      }

      return extensionPoint.conditions.some((extensionPointCondition) => {
        return conditions.some(
          ({series}) =>
            extensionPointCondition.series == null ||
            extensionPointCondition.series.handle === series.handle,
        );
      });
    });
  });
}
