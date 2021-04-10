import '@quilted/polyfills/fetch.node';

import * as path from 'path';
import {statSync} from 'fs';
import {readFile} from 'fs/promises';
import {createHash} from 'crypto';

import {createGraphQL, createHttpFetch} from '@quilted/graphql';
import type {GraphQL} from '@quilted/graphql';

import {
  buildDetailsForExtension,
  findMatchingProductionClipsExtension,
} from '../utilities';
import {loadProductionApp, loadLocalApp} from '../app';
import type {
  LocalApp,
  LocalExtension,
  ProductionClipsExtension,
  LocalExtensionConfigurationString,
} from '../app';

import pushClipsExtensionMutation from './graphql/PushClipsExtensionMutation.graphql';
import type {PushClipsExtensionMutationVariables} from './graphql/PushClipsExtensionMutation.graphql';
import createClipsExtensionAndInitialVersionMutation from './graphql/CreateClipsExtensionAndInitialVersionMutation.graphql';

type ConfigurationFieldInput = NonNullable<
  PushClipsExtensionMutationVariables['configurationSchema']
>[number];

type ConfigurationField = NonNullable<
  ConfigurationFieldInput[keyof ConfigurationFieldInput]
>;

type ExtensionSupport = NonNullable<
  PushClipsExtensionMutationVariables['supports']
>[number];

type ExtensionSupportCondition = NonNullable<
  ExtensionSupport['conditions']
>[keyof ExtensionSupport['conditions']];

export async function push() {
  const graphql = createGraphQL({
    fetch: createHttpFetch({uri: 'https://watch.lemon.tools/api/graphql'}),
  });

  const localApp = await loadLocalApp();

  verifyLocalBuild(localApp);

  const productionApp = await loadProductionApp(localApp.configuration.id, {
    graphql,
  });

  for (const extension of localApp.extensions) {
    await pushExtension(extension, {
      app: localApp,
      graphql,
      production: findMatchingProductionClipsExtension(
        extension,
        productionApp,
      ),
    });
  }
}

function verifyLocalBuild(app: LocalApp) {
  for (const extension of app.extensions) {
    const {filename, directory} = buildDetailsForExtension(extension, app);
    if (!statSync(path.join(directory, filename)).isFile()) {
      throw new Error(
        `Could not find build for extension ${extension.id}. Make sure you have run \`watchapp build\` before running this command.`,
      );
    }
  }
}

async function pushExtension(
  extension: LocalExtension,
  {
    app,
    graphql,
    production,
  }: {
    app: LocalApp;
    graphql: GraphQL;
    production?: ProductionClipsExtension;
  },
) {
  let assetUploadUrl: string | undefined;

  const {directory, filename} = buildDetailsForExtension(extension, app);

  const [scriptContents, translations] = await Promise.all([
    readFile(path.join(directory, filename), {
      encoding: 'utf8',
    }),
    loadTranslationsForExtension(extension),
  ]);

  const hash = createHash('sha256').update(scriptContents).digest('hex');

  const buildOptions: Pick<
    PushClipsExtensionMutationVariables,
    'hash' | 'supports' | 'translations' | 'configurationSchema'
  > = {
    hash,
    translations:
      translations && JSON.stringify(flattenTranslations(translations)),
    supports: extension.configuration.extensionPoints.map((supported) => {
      return {
        extensionPoint: supported.id,
        conditions: supported.conditions?.map(
          (condition): ExtensionSupportCondition => {
            if (condition.series) {
              return {seriesId: condition.series};
            }

            throw new Error();
          },
        ),
      };
    }),
    configurationSchema: extension.configuration.userConfiguration?.schema?.map(
      (
        field,
      ): NonNullable<
        PushClipsExtensionMutationVariables['configurationSchema']
      >[number] => {
        switch (field.type) {
          case 'string': {
            return {
              string: {
                key: field.key,
                label: configurationStringToGraphQLInput(field.label),
                default: field.default,
              },
            };
          }
          case 'number': {
            return {
              number: {
                key: field.key,
                label: configurationStringToGraphQLInput(field.label),
                default: field.default,
              },
            };
          }
          case 'options': {
            return {
              options: {
                key: field.key,
                label: configurationStringToGraphQLInput(field.label),
                default: field.default,
                options: field.options.map((option) => {
                  return {
                    value: option.value,
                    label: configurationStringToGraphQLInput(option.label),
                  };
                }),
              },
            };
          }
        }
      },
    ),
  };

  if (production) {
    /* eslint-disable no-console */
    console.log(
      `Updating existing extension ${extension.configuration.name} (id: ${production.id})`,
    );

    console.log(JSON.stringify(buildOptions, null, 2));
    /* eslint-enable no-console */

    const {data, error} = await graphql.mutate(pushClipsExtensionMutation, {
      variables: {
        extensionId: production.id,
        name: extension.configuration.name,
        ...buildOptions,
      },
    });

    if (error) {
      throw error;
    }

    if (data == null) {
      throw new Error('No data returned when creating clips version');
    }

    assetUploadUrl = data?.pushClipsExtension.signedScriptUpload ?? undefined;
  } else {
    // eslint-disable-next-line no-console
    console.log(`Creating new extension ${extension.configuration.name}`);

    const {data, error} = await graphql.mutate(
      createClipsExtensionAndInitialVersionMutation,
      {
        variables: {
          appId: app.configuration.id,
          name: extension.configuration.name,
          initialVersion: {...buildOptions},
        },
      },
    );

    if (error) {
      throw error;
    }

    if (data == null) {
      throw new Error('No data returned when creating clips version');
    }

    assetUploadUrl = data?.createClipsExtension.signedScriptUpload ?? undefined;
  }

  if (assetUploadUrl == null) {
    throw new Error('Nowhere to upload built extension :/');
  }

  await fetch(assetUploadUrl, {
    method: 'PUT',
    body: scriptContents,
    headers: {
      'Content-Length': String(scriptContents.length),
      'Content-Type': 'application/javascript',
    },
  });
}

async function loadTranslationsForExtension(extension: LocalExtension) {
  try {
    const result = await readFile(
      path.join(extension.root, 'translations/en.json'),
      {encoding: 'utf-8'},
    );
    return JSON.parse(result);
  } catch {
    return null;
  }
}

function flattenTranslations(nestedTranslations: Record<string, unknown>) {
  const flattened: Record<string, string> = {};

  const flattenObject = (
    object: Record<string, unknown>,
    nestedKey?: string,
  ) => {
    for (const [key, value] of Object.entries(object)) {
      const fullKey = nestedKey ? `${nestedKey}.${key}` : key;

      if (typeof value === 'string') {
        flattened[fullKey] = value;
      } else if (typeof value === 'object' && value != null) {
        flattenObject(value as Record<string, unknown>, fullKey);
      }
    }
  };

  flattenObject(nestedTranslations);

  return flattened;
}

function configurationStringToGraphQLInput(
  value: LocalExtensionConfigurationString,
): ConfigurationField['label'] {
  return typeof value === 'string'
    ? {static: value}
    : {translation: value.translation};
}
