import '@quilted/polyfills/fetch';

import * as path from 'path';
import {statSync} from 'fs';
import {readFile} from 'fs/promises';
import {createHash} from 'crypto';

import {PrintableError, Ui} from '../../ui';
import {authenticate} from '../../utilities/authentication';
import type {GraphQL} from '../../utilities/authentication';
import {buildDetailsForExtension} from '../../utilities/build';
import {
  loadProductionApp,
  loadLocalApp,
  ProductionApp,
  findMatchingProductionClipsExtension,
} from '../../utilities/app';
import type {
  LocalApp,
  LocalExtension,
  ProductionClipsExtension,
  LocalExtensionConfigurationString,
} from '../../utilities/app';

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

export async function push({ui}: {ui: Ui}) {
  const localApp = await loadLocalApp();

  if (localApp.extensions.length === 0) {
    ui.Heading('heads up!', {style: (content, style) => style.yellow(content)});
    ui.TextBlock(
      `Your app doesn’t have any extensions to push yet. Run ${ui.Code(
        'watchapp create extension',
      )} to get started!`,
    );

    return;
  }

  verifyLocalBuild(localApp, ui);

  const authenticatedContext = await authenticate({ui});

  const {graphql} = authenticatedContext;

  const productionApp = await loadProductionApp(localApp, {
    ui,
    graphql,
  });

  const hasOneExtension = localApp.extensions.length === 1;

  ui.TextBlock(
    `We’re pushing the latest changes for your ${
      hasOneExtension
        ? `${ui.Code(localApp.extensions[0]!.configuration.name)} extension`
        : `${localApp.extensions.length} extensions`
    }...`,
  );

  const results = await Promise.all(
    localApp.extensions.map((extension) =>
      pushExtension(extension, {
        ui,
        app: localApp,
        productionApp,
        graphql,
        production: findMatchingProductionClipsExtension(
          extension,
          productionApp,
        ),
      }),
    ),
  );

  const created: PushResult[] = [];
  const updated: PushResult[] = [];

  for (const result of results) {
    if (result.isNew) {
      created.push(result);
    } else {
      updated.push(result);
    }
  }

  ui.Heading('success!', {style: (content, style) => style.green(content)});

  if (created.length > 0) {
    if (created.length === 1) {
      ui.TextBlock(
        `Created extension ${ui.Code(
          created[0]!.extension.configuration.name,
        )}!`,
      );
    } else {
      ui.TextBlock(`Created ${created.length} extensions:`);
      ui.List((List) => {
        for (const {extension} of created) {
          List.Item(extension.configuration.name);
        }
      });
    }
  }

  if (updated.length > 0) {
    if (updated.length === 1) {
      ui.TextBlock(
        `Updated extension ${ui.Code(
          updated[0]!.extension.configuration.name,
        )}!`,
      );
    } else {
      ui.TextBlock(`Updated ${updated.length} extensions:`);
      ui.List((List) => {
        for (const {extension} of updated) {
          List.Item(extension.configuration.name);
        }
      });
    }
  }
}

function verifyLocalBuild(app: LocalApp, ui: Ui) {
  for (const extension of app.extensions) {
    const {filename, directory} = buildDetailsForExtension(extension, app);
    if (!statSync(path.join(directory, filename)).isFile()) {
      throw new PrintableError(
        `Could not find build for extension ${
          extension.id
        }. Make sure you have run ${ui.Code(
          'watchapp build',
        )} before running this command.`,
      );
    }
  }
}

interface PushResult {
  isNew: boolean;
  extension: LocalExtension;
}

async function pushExtension(
  extension: LocalExtension,
  {
    ui,
    app,
    graphql,
    production,
    productionApp,
  }: {
    ui: Ui;
    app: LocalApp;
    graphql: GraphQL;
    production?: ProductionClipsExtension;
    productionApp: ProductionApp;
  },
): Promise<PushResult> {
  let result: PushResult;
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
    const {data} = await graphql.mutate(pushClipsExtensionMutation, {
      variables: {
        extensionId: production.id,
        name: extension.configuration.name,
        ...buildOptions,
      },
    });

    if (data == null) {
      throw new PrintableError(
        `We could not create a new version for extension ${ui.Code(
          extension.configuration.name,
        )}. This might be because you have an existing extension with the same name, but if that’s not the case, you might need to try running this command again. Sorry about that!`,
      );
    }

    result = {extension, isNew: false};
    assetUploadUrl = data?.pushClipsExtension.signedScriptUpload ?? undefined;
  } else {
    const {data} = await graphql.mutate(
      createClipsExtensionAndInitialVersionMutation,
      {
        variables: {
          appId: productionApp.id,
          name: extension.configuration.name,
          initialVersion: {...buildOptions},
        },
      },
    );

    if (data == null) {
      throw new PrintableError(
        `We could not create a new extension for ${ui.Code(
          extension.configuration.name,
        )}. This might be because you have an existing extension with the same name, but if that’s not the case, you might need to try running this command again. Sorry about that!`,
      );
    }

    result = {extension, isNew: true};
    assetUploadUrl = data?.createClipsExtension.signedScriptUpload ?? undefined;
  }

  if (assetUploadUrl == null) {
    throw new PrintableError(
      `We could not upload your ${ui.Code(
        extension.configuration.name,
      )} extension’s assets. This shouldn’t have happened, so you might need to try running this command again. Sorry about that!`,
    );
  }

  const assetUploadResult = await fetch(assetUploadUrl, {
    method: 'PUT',
    body: scriptContents,
    headers: {
      'Content-Length': String(scriptContents.length),
      'Content-Type': 'application/javascript',
    },
  });

  if (!assetUploadResult.ok) {
    throw new PrintableError(
      `We could not upload your ${ui.Code(
        extension.configuration.name,
      )} extension’s assets. This shouldn’t have happened, so you might need to try running this command again. Sorry about that!`,
    );
  }

  return result;
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
