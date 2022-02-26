import type {IResolvers} from '@graphql-tools/utils';

import type {
  CreateClipsInitialVersion,
  ClipsExtensionPointSupportInput,
  ClipsExtensionConfigurationSchemaFieldsInput,
  ClipsExtensionConfigurationStringInput,
} from './schema-input-types';
import {Context} from './context';
import {ClipsExtensionPointConditionInput} from './schema';

type Resolver<Source = never> = IResolvers<Source, Context>;

export const Query: Resolver = {
  app(_, {id}: {id: string}, {prisma}) {
    return prisma.app.findFirst({where: {id: fromGid(id).id}});
  },
  apps(_, __, {prisma}) {
    return prisma.app.findMany({take: 50});
  },
  async clipsInstallations(
    _,
    {
      extensionPoint,
      conditions = [],
    }: {
      extensionPoint: string;
      conditions?: ClipsExtensionPointConditionInput[];
    },
    {user, prisma},
  ) {
    const installations = await prisma.clipsExtensionInstallation.findMany({
      where: {
        userId: user.id,
        extensionPoint,
        extension: {activeVersion: {status: 'PUBLISHED'}},
      },
      include: {
        extension: {
          select: {activeVersion: {select: {status: true, supports: true}}},
        },
      },
      take: 50,
    });

    return installations.filter((installation) => {
      const version = installation.extension.activeVersion;

      if (version == null || version.status !== 'PUBLISHED') {
        return false;
      }

      return conditions.every((condition) => {
        if (condition.seriesId) {
          return ((version.supports as any[]) ?? []).every((supports: any) => {
            return (
              extensionPoint !== supports.extensionPoint ||
              supports.conditions.every(
                (supportCondition: any) =>
                  supportCondition.type !== 'series' ||
                  supportCondition.id === condition.seriesId,
              )
            );
          });
        }

        throw new Error();
      });
    });
  },
  clipsInstallation(_, {id}: {id: string}, {prisma}) {
    return prisma.clipsExtensionInstallation.findFirst({
      where: {id: fromGid(id).id},
    });
  },
};

export const Mutation: Resolver = {
  async createApp(_, {name}: {name: string}, {prisma, user}) {
    const existingAppWithName = await prisma.app.findFirst({
      where: {name, userId: user.id},
    });

    if (existingAppWithName) {
      throw new Error(
        `Existing app found with name ${JSON.stringify(name)} (id: ${
          existingAppWithName.id
        })`,
      );
    }

    const app = await prisma.app.create({data: {name, userId: user.id}});

    return {app};
  },
  async deleteApp(_, {id}: {id: string}, {prisma}) {
    // await prisma.app.delete({where: {id: fromGid(id).id}});
    // @see https://github.com/prisma/prisma/issues/2057
    await prisma.$executeRaw`delete from "App" where id=${fromGid(id).id}`;
    return {deletedId: id};
  },
  updateApp(_, {id, name}: {id: string; name?: string}, {prisma}) {
    return prisma.app.update({where: {id: fromGid(id).id}, data: {name}});
  },
  async createClipsExtension(
    _,
    {
      name,
      appId,
      initialVersion,
    }: {
      appId: string;
      name: string;
      initialVersion?: CreateClipsInitialVersion;
    },
    {prisma},
  ) {
    const {app, ...extension} = await prisma.clipsExtension.create({
      data: {
        name,
        appId: fromGid(appId).id,
      },
      include: {app: true},
    });

    if (initialVersion == null) {
      return {app, extension};
    }

    const {version: versionInput, signedScriptUpload} =
      await createStagedClipsVersion({
        appId: fromGid(appId).id,
        extensionId: extension.id,
        extensionName: name,
        ...initialVersion,
      });

    const version = await prisma.clipsExtensionVersion.create({
      data: {...versionInput, extensionId: extension.id, status: 'BUILDING'},
    });

    return {
      app,
      extension,
      version,
      signedScriptUpload,
    };
  },
  async deleteClipsExtension(_, {id}: {id: string}, {prisma}) {
    const {app} = await prisma.clipsExtension.delete({
      where: {id: fromGid(id).id},
      select: {app: true},
    });

    return {deletedId: id, app};
  },
  updateClipsExtension(_, {id, name}: {id: string; name?: string}, {prisma}) {
    if (name == null) {
      throw new Error();
    }

    return prisma.clipsExtension.update({
      data: {name},
      where: {id: fromGid(id).id},
    });
  },
  async pushClipsExtension(
    _,
    {
      extensionId,
      hash,
      name,
      translations,
      supports,
      configurationSchema,
    }: {
      extensionId: string;
      hash: string;
      name?: string;
      translations?: string;
      supports?: ClipsExtensionPointSupportInput[];
      configurationSchema?: ClipsExtensionConfigurationSchemaFieldsInput[];
    },
    {prisma},
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

    const {version: versionInput, signedScriptUpload} =
      await createStagedClipsVersion({
        hash,
        appId: extension.appId,
        extensionId: id,
        extensionName: name ?? extension.name,
        translations,
        supports,
        configurationSchema,
      });

    if (existingVersion) {
      const version = await prisma.clipsExtensionVersion.update({
        where: {id: existingVersion.id},
        data: {...versionInput},
      });

      return {
        version,
        signedScriptUpload,
        extension,
      };
    }

    const version = await prisma.clipsExtensionVersion.create({
      data: {...versionInput, extensionId: id, status: 'BUILDING'},
    });

    return {
      extension,
      version,
      signedScriptUpload,
    };
  },
  async publishLatestClipsExtensionVersion(
    _,
    {extensionId}: {extensionId: string},
    {prisma},
  ) {
    const result = await prisma.clipsExtensionVersion.findFirst({
      where: {status: 'BUILDING', extensionId: fromGid(extensionId).id},
      include: {extension: true},
    });

    if (result == null) {
      return {};
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
  async installApp(_, {id}: {id: string}, {user, prisma}) {
    const {app, ...installation} = await prisma.appInstallation.create({
      data: {appId: fromGid(id).id, userId: user.id},
      include: {app: true},
    });

    return {app, installation};
  },
  async installClipsExtension(
    _,
    {
      id,
      extensionPoint,
      configuration,
    }: {id: string; extensionPoint?: string; configuration?: string},
    {user, prisma},
  ) {
    const extension = await prisma.clipsExtension.findFirst({
      where: {id: fromGid(id).id},
      select: {
        id: true,
        appId: true,
        activeVersion: {select: {supports: true}},
      },
      rejectOnNotFound: true,
    });

    let resolvedExtensionPoint = extensionPoint;

    if (resolvedExtensionPoint == null) {
      const supports = extension.activeVersion
        ?.supports as any as ClipsExtensionPointSupportInput[];

      if (supports?.length === 1) {
        resolvedExtensionPoint = supports[0].extensionPoint;
      }
    }

    if (resolvedExtensionPoint == null) {
      throw new Error(
        `Could not determine an extension point, you must explicitly provide an extensionPoint argument`,
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
        extensionPoint: resolvedExtensionPoint,
        configuration,
        appInstallationId: appInstallation.id,
      },
    });

    return {
      extension,
      installation,
    };
  },
  async uninstallClipsExtension(_, {id}: {id: string}, {user, prisma}) {
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
  async updateClipsExtensionInstallation(
    _,
    {id, configuration}: {id: string; configuration?: string},
    {user, prisma},
  ) {
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
        data: {
          configuration,
        },
      });

    return {
      extension,
      installation,
    };
  },
};

export const AppExtension: Resolver = {
  __resolveType: resolveType,
};

export const AppExtensionInstallation: Resolver = {
  __resolveType: resolveType,
};

export const App: Resolver<import('@prisma/client').App> = {
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

export const AppInstallation: Resolver<
  import('@prisma/client').AppInstallation
> = {
  id: ({id}) => toGid(id, 'AppInstallation'),
  app: ({appId}, _, {prisma}) => prisma.app.findFirst({where: {id: appId}}),
  async extensions({id}, _, {prisma}) {
    const installations = await prisma.clipsExtensionInstallation.findMany({
      where: {appInstallationId: id},
      take: 50,
      // orderBy: {createAt, 'desc'},
    });

    return installations.map(addResolvedType('ClipsExtensionInstallation'));
  },
};

export const ClipsExtension: Resolver<import('@prisma/client').ClipsExtension> =
  {
    id: ({id}) => toGid(id, 'ClipsExtension'),
    app: ({appId}, _, {prisma}) => prisma.app.findFirst({where: {id: appId}}),
    latestVersion({activeVersionId}, _, {prisma}) {
      return (
        activeVersionId &&
        prisma.clipsExtensionVersion.findFirst({where: {id: activeVersionId}})
      );
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

export const ClipsExtensionVersion: Resolver<
  import('@prisma/client').ClipsExtensionVersion
> = {
  id: ({id}) => toGid(id, 'ClipsExtensionVersion'),
  extension: ({extensionId}, _, {prisma}) =>
    prisma.clipsExtension.findFirst({where: {id: extensionId}}),
  assets: ({scriptUrl}) => (scriptUrl ? [{source: scriptUrl}] : []),
  translations: ({translations}) =>
    translations && JSON.stringify(translations),
  supports: ({supports}) => supports ?? [],
  configurationSchema: ({configurationSchema}) => configurationSchema ?? [],
};

function resolveClipsExtensionPointCondition(condition: {type: string}) {
  switch (condition.type) {
    case 'series':
      return 'ClipsExtensionPointSeriesCondition';
  }

  throw new Error(`Unknown condition: ${condition}`);
}

export const ClipsExtensionPointCondition: Resolver = {
  __resolveType: resolveClipsExtensionPointCondition,
};

function resolveClipsExtensionString(stringType: {type: string}) {
  switch (stringType.type) {
    case 'static':
      return 'ClipsExtensionConfigurationStringStatic';
    case 'translation':
      return 'ClipsExtensionConfigurationStringTranslation';
  }

  throw new Error(`Unknown stringType: ${stringType}`);
}

export const ClipsExtensionConfigurationString: Resolver = {
  __resolveType: resolveClipsExtensionString,
};

function resolveClipsConfigurationField(configurationField: {type: string}) {
  switch (configurationField.type) {
    case 'string':
      return 'ClipsExtensionStringConfigurationField';
    case 'number':
      return 'ClipsExtensionNumberConfigurationField';
    case 'options':
      return 'ClipsExtensionOptionsConfigurationField';
  }

  throw new Error(`Unknown configuration field: ${configurationField}`);
}

export const ClipsExtensionConfigurationField: Resolver = {
  __resolveType: resolveClipsConfigurationField,
};

export const ClipsExtensionInstallation: Resolver<
  import('@prisma/client').ClipsExtensionInstallation
> = {
  id: ({id}) => toGid(id, 'ClipsExtensionInstallation'),
  extension: ({extensionId}, _, {prisma}) =>
    prisma.clipsExtension.findFirst({where: {id: extensionId}}),
  appInstallation: ({appInstallationId}, _, {prisma}) =>
    prisma.appInstallation.findFirst({where: {id: appInstallationId}}),
  async version({extensionId}, _, {prisma}) {
    const extension = await prisma.clipsExtension.findFirst({
      where: {id: extensionId},
      select: {activeVersion: true},
    });

    return extension?.activeVersion;
  },
  configuration: ({configuration}) =>
    configuration ? JSON.stringify(configuration) : null,
};

function addResolvedType(type: string) {
  return <T>(rest: T): T => ({...rest, __resolvedType: type});
}

function resolveType(obj: {__resolvedType?: string; id: string}) {
  return obj.__resolvedType ?? fromGid(obj.id).type;
}

async function createStagedClipsVersion({
  hash,
  appId,
  extensionId,
  extensionName,
  translations,
  supports,
  configurationSchema,
}: {
  hash: string;
  appId: string;
  extensionId: string;
  extensionName: string;
} & CreateClipsInitialVersion) {
  const [{S3Client, PutObjectCommand}, {getSignedUrl}, {getType}] =
    await Promise.all([
      import('@aws-sdk/client-s3'),
      import('@aws-sdk/s3-request-presigner'),
      import('mime'),
    ]);

  const s3Client = new S3Client({region: 'us-east-1'});

  const path = `assets/clips/${appId}/${toParam(
    extensionName,
  )}.${extensionId}.${hash}.js`;

  const putCommand = new PutObjectCommand({
    Bucket: 'watch-assets-clips',
    Key: path,
    ContentType: getType(path) ?? 'application/javascript',
    CacheControl: `public, max-age=${60 * 60 * 24 * 365}, immutable`,
    Metadata: {
      'Timing-Allow-Origin': '*',
    },
  });

  const signedScriptUpload = await getSignedUrl(s3Client, putCommand, {
    expiresIn: 3_600,
  });

  const version: Omit<
    import('@prisma/client').Prisma.ClipsExtensionVersionCreateWithoutExtensionInput,
    'status'
  > = {
    scriptUrl: `https://watch.lemon.tools/${path}`,
    apiVersion: 'UNSTABLE',
    translations: translations && JSON.parse(translations),
    supports:
      supports &&
      (supports.map(({extensionPoint, conditions}) => {
        return {
          extensionPoint,
          conditions: conditions?.map((condition) => {
            let resolvedCondition;

            if (condition.seriesId) {
              resolvedCondition = {type: 'series', id: condition.seriesId};
            }

            if (resolvedCondition == null) {
              throw new Error();
            }

            return resolvedCondition;
          }),
        };
      }) as any),
    configurationSchema:
      configurationSchema &&
      (configurationSchema.map(
        ({string: stringField, number: numberField, options: optionsField}) => {
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
            const {key, label, options, default: defaultValue} = optionsField;
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
      ) as any),
  };

  return {signedScriptUpload, version};
}

function normalizeClipsString({
  static: staticString,
  translation,
}: ClipsExtensionConfigurationStringInput) {
  if (staticString) {
    return {type: 'static', value: staticString};
  }

  if (translation) {
    return {type: 'translation', key: translation};
  }

  throw new Error();
}

function fromGid(gid: string) {
  const {type, id} = /gid:\/\/watch\/(?<type>\w+)\/(?<id>[\w-]+)/.exec(gid)!
    .groups!;
  return {type, id};
}

function toGid(id: string, type: string) {
  return `gid://watch/${type}/${id}`;
}

function toParam(name: string) {
  return name.trim().toLocaleLowerCase().replace(/\s+/g, '-');
}
