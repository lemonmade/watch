import '@quilted/polyfills/fetch';

import * as path from 'path';
import {statSync} from 'fs';
import {readFile} from 'fs/promises';

import {PrintableError, Ui} from '../../ui';
import {authenticate} from '../../utilities/authentication';
import type {GraphQLFetch} from '../../utilities/authentication';
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
  PushClipsExtensionMutationVariables['settings']['fields']
>[number];

type ConfigurationField = NonNullable<
  ConfigurationFieldInput[keyof ConfigurationFieldInput]
>;

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
        ? `${ui.Code(localApp.extensions[0]!.name)} extension`
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
      ui.TextBlock(`Created extension ${ui.Code(created[0]!.extension.name)}!`);
    } else {
      ui.TextBlock(`Created ${created.length} extensions:`);
      ui.List((List) => {
        for (const {extension} of created) {
          List.Item(extension.name);
        }
      });
    }
  }

  if (updated.length > 0) {
    if (updated.length === 1) {
      ui.TextBlock(`Updated extension ${ui.Code(updated[0]!.extension.name)}!`);
    } else {
      ui.TextBlock(`Updated ${updated.length} extensions:`);
      ui.List((List) => {
        for (const {extension} of updated) {
          List.Item(extension.name);
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
    graphql: GraphQLFetch;
    production?: ProductionClipsExtension;
    productionApp: ProductionApp;
  },
): Promise<PushResult> {
  let result: PushResult;

  const {directory, filename} = buildDetailsForExtension(extension, app);

  const [code, translations] = await Promise.all([
    readFile(path.join(directory, filename), {
      encoding: 'utf8',
    }),
    loadTranslationsForExtension(extension),
  ]);

  const buildOptions: Pick<
    PushClipsExtensionMutationVariables,
    'code' | 'extends' | 'translations' | 'settings'
  > = {
    code,
    translations:
      translations && JSON.stringify(flattenTranslations(translations)),
    extends: extension.extends.map((supported) => {
      return {
        target: supported.target,
        conditions: supported.conditions,
      };
    }),
    settings: {
      fields: extension.settings.fields.map(
        (
          field,
        ): NonNullable<
          PushClipsExtensionMutationVariables['settings']['fields']
        >[number] => {
          switch (field.type) {
            case 'string': {
              return {
                string: {
                  key: field.id,
                  label: configurationStringToGraphQLInput(field.label),
                  default: field.default,
                },
              };
            }
            case 'number': {
              return {
                number: {
                  key: field.id,
                  label: configurationStringToGraphQLInput(field.label),
                  default: field.default,
                },
              };
            }
            case 'options': {
              return {
                options: {
                  key: field.id,
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
    },
  };

  if (production) {
    const {data} = await graphql(pushClipsExtensionMutation, {
      variables: {
        id: production.id,
        name: extension.name,
        ...buildOptions,
      },
    });

    if (data == null) {
      throw new PrintableError(
        `We could not create a new version for extension ${ui.Code(
          extension.name,
        )}. This might be because you have an existing extension with the same name, but if that’s not the case, you might need to try running this command again. Sorry about that!`,
      );
    }

    result = {extension, isNew: false};
  } else {
    const {data} = await graphql(
      createClipsExtensionAndInitialVersionMutation,
      {
        variables: {
          appId: productionApp.id,
          name: extension.name,
          initialVersion: {...buildOptions},
        },
      },
    );

    if (data == null) {
      throw new PrintableError(
        `We could not create a new extension for ${ui.Code(
          extension.name,
        )}. This might be because you have an existing extension with the same name, but if that’s not the case, you might need to try running this command again. Sorry about that!`,
      );
    }

    result = {extension, isNew: true};
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
    // intentional no-op
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
