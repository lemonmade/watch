import {createHash} from 'crypto';
import type {
  Series as DatabaseSeries,
  ClipsExtension as DatabaseClipsExtension,
  ClipsExtensionVersion as DatabaseClipsExtensionVersion,
  ClipsExtensionInstallation as DatabaseClipsExtensionInstallation,
} from '@prisma/client';
import type {ExtensionPoint} from '@watching/clips';
import {z} from 'zod';

import {createSignedToken} from '~/global/tokens.ts';

import type {
  ClipsExtensionBuildModuleInput,
  ClipsExtensionPointSupportInput,
  ClipsExtensionPointSupportConditionInput,
  CreateClipsInitialVersion,
  ClipsExtensionSettingsStringInput,
} from '../../schema.ts';

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

type DatabaseClipsExtensionInstallationWithActiveVersion =
  DatabaseClipsExtensionInstallation & {
    extension: DatabaseClipsExtension & {
      activeVersion: DatabaseClipsExtensionVersion | null;
    };
  };

declare module '../types' {
  export interface GraphQLValues {
    ClipsExtension: DatabaseClipsExtension;
    ClipsExtensionVersion: DatabaseClipsExtensionVersion;
    ClipsExtensionInstallation: DatabaseClipsExtensionInstallationWithActiveVersion;
    ClipsExtensionPointInstallation: {
      target: ExtensionPoint;
      installation: DatabaseClipsExtensionInstallationWithActiveVersion;
    };
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
          include: {activeVersion: true},
        },
      },
      take: 50,
    });

    if (installations.length === 0) return [];

    const resolvedConditions = await resolveConditions(conditions, {prisma});

    return filterInstallations(installations, {
      target,
      conditions: resolvedConditions,
    }).map(({installation}) => installation);
  },
  async clipsInstallation(_, {id}, {prisma}) {
    const installation =
      await prisma.clipsExtensionInstallation.findUniqueOrThrow({
        where: {id: fromGid(id).id},
        include: {
          extension: {
            include: {activeVersion: true},
          },
        },
      });

    return installation;
  },
});

export const Mutation = createMutationResolver({
  async createClipsExtension(
    _,
    {name, handle, appId, initialVersion},
    {prisma, request, env},
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
      env,
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
    {id: extensionId, build, name, translations, extends: supports, settings},
    {prisma, request, env},
  ) {
    const id = fromGid(extensionId).id;

    const existingVersion = await prisma.clipsExtensionVersion.findFirst({
      where: {extensionId: id, status: 'BUILDING'},
      select: {id: true},
    });

    const extension = await prisma.clipsExtension.findUniqueOrThrow({
      where: {id},
    });

    const {version: versionInput} = await createStagedClipsVersion({
      id,
      build,
      appId: extension.appId,
      extensionName: name ?? extension.name,
      translations,
      extends: supports,
      settings,
      request,
      env,
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
    const extension = await prisma.clipsExtension.findUniqueOrThrow({
      where: {id: fromGid(id).id},
      include: {
        activeVersion: true,
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
      include: {
        extension: {
          include: {activeVersion: true},
        },
      },
    });

    return {
      extension,
      installation,
    };
  },
  async uninstallClipsExtension(_, {id}, {user, prisma}) {
    const installation =
      await prisma.clipsExtensionInstallation.findUniqueOrThrow({
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
      await prisma.clipsExtensionInstallation.findUniqueOrThrow({
        where: {id: fromGid(id).id, userId: user.id},
        select: {id: true, userId: true},
      });

    const installation = await prisma.clipsExtensionInstallation.update({
      where: {id: installationDetails.id},
      include: {
        extension: {
          include: {activeVersion: true},
        },
      },
      data:
        settings == null
          ? {}
          : {
              settings: JSON.parse(settings),
            },
    });

    return {
      extension: installation.extension,
      installation,
    };
  },
});

export const ClipsExtension = createResolverWithGid('ClipsExtension', {
  app: ({appId}, _, {prisma}) =>
    prisma.app.findUniqueOrThrow({where: {id: appId}}),
  latestVersion({activeVersionId}, _, {prisma}) {
    return activeVersionId
      ? prisma.clipsExtensionVersion.findUniqueOrThrow({
          where: {id: activeVersionId},
        })
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
      prisma.clipsExtension.findUniqueOrThrow({
        where: {id: extensionId},
      }),
    translations: ({translations}) =>
      translations ? JSON.stringify(translations) : null,
    // Database needs to store the exact right shapes in its JSON fields
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
      prisma.clipsExtension.findUniqueOrThrow({
        where: {id: extensionId},
      }),
    appInstallation: ({appInstallationId}, _, {prisma}) =>
      prisma.appInstallation.findUniqueOrThrow({
        where: {id: appInstallationId},
      }),
    async version({extension}) {
      return extension.activeVersion!;
    },
    async translations({extension}) {
      const translations = extension.activeVersion?.translations;

      return translations ? JSON.stringify(translations) : null;
    },
    settings: ({settings}) => (settings ? JSON.stringify(settings) : null),
  },
);

export const ClipsExtensionPointInstallation = createResolverWithGid(
  'ClipsExtensionPointInstallation',
  {
    id: ({target, installation}) =>
      toGid(`${installation.id}/${target}`, 'ClipsExtensionPointInstallation'),
    target: ({target}) => target,
    apiVersion: ({installation}) =>
      installation.extension.activeVersion!.apiVersion,
    entry({target, installation}) {
      const {activeVersion} = installation.extension;

      const {entry} = getExtensionPoint(target, installation);

      const module: ClipsExtensionBuildModuleDatabaseJSON =
        activeVersion?.scriptUrl
          ? {
              contentType: 'JAVASCRIPT',
              name: '_extension.js',
              content: '',
              src: activeVersion.scriptUrl,
            }
          : getExtensionBuildModule(entry.module, installation);

      switch (module.contentType) {
        case 'JAVASCRIPT':
          return {
            asHTML: null,
            asJavaScript: {
              src: module.src!,
            },
          };
        case 'HTML':
          return {
            asHTML: {
              content: module.content,
            },
            asJavaScript: null,
          };
        default:
          throw new Error(`Unsupported content type: ${module.contentType}`);
      }
    },
    liveQuery({target, installation}) {
      const {liveQuery} = getExtensionPoint(target, installation);

      if (liveQuery == null) return null;

      if (typeof liveQuery === 'string') {
        return {content: liveQuery};
      }

      const module = getExtensionBuildModule(liveQuery.module, installation);

      return {
        content: module.content,
      };
    },
    loading({target, installation}) {
      const {loading} = getExtensionPoint(target, installation);

      if (loading == null) return null;

      if (typeof loading === 'string') {
        return {content: loading};
      }

      const module = getExtensionBuildModule(loading.module, installation);

      return {
        content: module.content,
      };
    },
    settings: ({installation}) =>
      installation.extension.activeVersion?.settings
        ? JSON.stringify(installation.extension.activeVersion.settings)
        : null,
    translations: ({installation}) =>
      installation.extension.activeVersion?.translations
        ? JSON.stringify(installation.extension.activeVersion.translations)
        : null,
    extension: ({installation}) => installation.extension,
    extensionInstallation: ({installation}) => installation,
    appInstallation: ({installation}, _, {prisma}) =>
      prisma.appInstallation.findUniqueOrThrow({
        where: {id: installation.appInstallationId},
      }),
  },
);

function getExtensionPoint(
  target: string,
  installation: DatabaseClipsExtensionInstallationWithActiveVersion,
) {
  const extend = installation.extension.activeVersion
    ?.extends as any as ClipsExtensionPointSupportDatabaseJSON[];
  const extensionPoint = extend?.find((extend) => extend.target === target);

  if (extensionPoint == null) {
    throw new Error(`Extension point not found: ${target}`);
  }

  return extensionPoint;
}

function getExtensionBuildModule(
  name: string,
  installation: DatabaseClipsExtensionInstallationWithActiveVersion,
) {
  const modules = (
    installation.extension.activeVersion
      ?.build as any as ClipsExtensionBuildDatabaseJSON
  )?.modules;

  const module = modules?.find((module) => module.name === name);

  if (module == null) {
    throw new Error(`Unknown module: ${name}`);
  }

  return module;
}

const SeriesExtensionPoint = z.enum(['series.details.accessory']);

export const Series = createResolver('Series', {
  async clipsToRender(series, {target}, {user, prisma}) {
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
          include: {activeVersion: true},
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
  async clipsToRender({seriesId}, {target}, {user, prisma}) {
    if (!WatchThroughExtensionPoint.safeParse(target).success) {
      throw new Error(`Invalid target: ${target}`);
    }

    const [series, installations] = await Promise.all([
      prisma.series.findUniqueOrThrow({
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
            include: {activeVersion: true},
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

async function parseExtensionPointTarget(extensionPoint: string) {
  const {validateExtensionPoint} = await import('@watching/tools/extension');

  if (!validateExtensionPoint(extensionPoint)) {
    throw new Error(`Unsupported extension point: ${extensionPoint}`);
  }

  return extensionPoint;
}

async function parseLiveQuery(liveQuery: string) {
  const {validateAndNormalizeLiveQuery} = await import(
    '@watching/tools/extension'
  );
  return validateAndNormalizeLiveQuery(liveQuery);
}

async function parseLoadingUI(loadingUI: string) {
  const {validateAndNormalizeLoadingUI} = await import(
    '@watching/tools/extension'
  );
  return validateAndNormalizeLoadingUI(loadingUI);
}

interface ClipsExtensionBuildDatabaseJSON {
  modules: ClipsExtensionBuildModuleDatabaseJSON[];
}

interface ClipsExtensionBuildModuleDatabaseJSON
  extends ClipsExtensionBuildModuleInput {
  src?: string;
}

interface ClipsExtensionPointSupportDatabaseJSON
  extends ClipsExtensionPointSupportInput {
  target: ExtensionPoint;
}

// const ClipsExtensionBuildModuleInputSchema = z.object({
//   name: z.string(),
//   content: z.string(),
//   contentType: z.enum(['JAVASCRIPT', 'HTML', 'GRAPHQL']),
// });

// const ClipsExtensionBuildModuleDatabaseSchema =
//   ClipsExtensionBuildModuleInputSchema.extend({
//     src: z.string().optional(),
//   });

// const ClipsExtensionBuildDatabaseSchema = z.object({
//   modules: z.array(ClipsExtensionBuildModuleDatabaseSchema),
// });

// const ClipsExtensionPointSupportConditionInputSchema = z.object({
//   series: z
//     .object({
//       handle: z.string().optional(),
//     })
//     .optional(),
// });

// const ClipsExtensionPointModuleDatabaseSchema = z.object({
//   module: z.string(),
// });

// const ClipsExtensionPointSchema = z.enum([
//   'series.details.accessory',
//   'watch-through.details.accessory',
// ]);

// const ClipsExtensionPointSupportDatabaseSchema = z.object({
//   target: ClipsExtensionPointSchema,
//   conditions: z
//     .array(ClipsExtensionPointSupportConditionInputSchema)
//     .optional(),
//   entry: ClipsExtensionPointModuleDatabaseSchema,
//   liveQuery: ClipsExtensionPointModuleDatabaseSchema.optional(),
//   loading: ClipsExtensionPointModuleDatabaseSchema.optional(),
// });

async function createStagedClipsVersion({
  build,
  appId,
  extensionName,
  translations,
  extends: supports,
  request,
  settings,
  env,
}: {
  id: string;
  appId: string;
  extensionName: string;
} & Pick<ResolverContext, 'request' | 'env'> &
  CreateClipsInitialVersion) {
  const modules = new Map<string, ClipsExtensionBuildModuleDatabaseJSON>();

  for (const buildModule of build.modules) {
    if (buildModule.contentType === 'JAVASCRIPT') {
      if (buildModule.name !== '_extension.js') continue;
      modules.set(buildModule.name, buildModule);
    }

    if (buildModule.content.length > 10_000) {
      throw new Error(
        `Clip module content for ${buildModule.name} is too long`,
      );
    }

    modules.set(buildModule.name, buildModule);
  }

  const javascriptModule = modules.get('_extension.js');

  if (javascriptModule) {
    const code = javascriptModule.content;

    const hash = createHash('sha256').update(code).digest('hex');
    const path = `assets/clips/${appId}/${toParam(extensionName)}.${hash.slice(
      0,
      8,
    )}.js`;

    const token = await createSignedToken(
      {path, code},
      {
        secret: env.UPLOAD_CLIPS_JWT_SECRET,
        expiresIn: 5 * 60 * 1_000,
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

    javascriptModule.content = '';
    javascriptModule.src = `https://watch.lemon.tools/${path}`;
  }

  const extensionPoints = await Promise.all(
    (supports ?? []).map(
      async ({target, entry, liveQuery, loading, conditions}) => {
        if (!modules.has(entry.module)) {
          throw new Error(`Unknown entry module: ${entry.module}`);
        }

        if (liveQuery) {
          const module = modules.get(liveQuery.module);

          if (module == null) {
            throw new Error(`Unknown live query module: ${liveQuery.module}`);
          }

          if (module.contentType !== 'GRAPHQL') {
            throw new Error(
              `Unsupported content type for live query: ${module.contentType}`,
            );
          }

          // TODO: what if multiple targets use the same live query?
          module.content = await parseLiveQuery(module.content);
        }

        if (loading) {
          const module = modules.get(loading.module);

          if (module == null) {
            throw new Error(`Unknown loading module: ${loading.module}`);
          }

          module.content = await parseLoadingUI(module.content);
        }

        return {
          target: await parseExtensionPointTarget(target),
          entry,
          liveQuery,
          loading,
          conditions: conditions?.map((condition) => {
            if (condition?.series?.handle == null) {
              throw new Error(`Unknown condition: ${condition}`);
            }

            return condition;
          }),
        } satisfies ClipsExtensionPointSupportDatabaseJSON;
      },
    ),
  );

  const version: Omit<
    import('@prisma/client').Prisma.ClipsExtensionVersionCreateWithoutExtensionInput,
    'status'
  > = {
    apiVersion: 'UNSTABLE',
    translations: translations && JSON.parse(translations),
    build: {
      modules: Array.from(modules.values()),
    } satisfies ClipsExtensionBuildDatabaseJSON as any,
    extends: extensionPoints as any,
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
        const series = await prisma.series.findUniqueOrThrow({
          where: {id: fromGid(condition.series.id).id},
        });

        return {condition, series};
      }

      if (condition.series.handle != null) {
        const series = await prisma.series.findUniqueOrThrow({
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
  installations: DatabaseClipsExtensionInstallationWithActiveVersion[],
  {
    target,
    conditions,
  }: {
    target?: string | null;
    conditions: ResolvedCondition[];
  },
) {
  return installations.flatMap<{
    target: ExtensionPoint;
    installation: DatabaseClipsExtensionInstallationWithActiveVersion;
  }>((installation) => {
    const version = installation.extension.activeVersion;

    if (version == null || version.status !== 'PUBLISHED') {
      return [];
    }

    const matches = (
      version.extends as unknown as ClipsExtensionPointSupportDatabaseJSON[]
    ).some((extensionPoint) => {
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

    return matches
      ? {target: installation.target as ExtensionPoint, installation}
      : [];
  });
}
