import type {GraphQL} from '@quilted/graphql';

import type {Ui} from '../../ui';
import {PrintableError} from '../../ui';

import {authenticate} from '../../utilities/authentication';
import {
  findMatchingProductionClipsExtension,
  loadProductionApp,
  loadLocalApp,
} from '../../utilities/app';
import type {
  LocalExtension,
  ProductionClipsExtension,
} from '../../utilities/app';

import publishLatestClipsExtensionVersion from './graphql/PublishLatestClipsExtensionVersionMutation.graphql';

export async function publish({ui}: {ui: Ui}) {
  const {graphql} = await authenticate({ui});

  const localApp = await loadLocalApp();

  if (localApp.extensions.length === 0) {
    ui.Heading('heads up!', {style: (content, style) => style.yellow(content)});
    ui.TextBlock(
      `Your app doesn’t have any extensions to publish yet. Run ${ui.Code(
        'watchapp create extension',
      )} to get started!`,
    );

    process.exitCode = 1;
    return;
  }

  const productionApp = await loadProductionApp(localApp, {
    ui,
    graphql,
  });

  const hasOneExtension = localApp.extensions.length === 1;

  ui.TextBlock(
    `We’re publishing the latest version of your ${
      hasOneExtension
        ? `${ui.Code(localApp.extensions[0].configuration.name)} extension`
        : `${localApp.extensions.length} extensions`
    }...`,
  );

  await Promise.all(
    localApp.extensions.map((extension) =>
      publishExtension(extension, {
        ui,
        graphql,
        production: findMatchingProductionClipsExtension(
          extension,
          productionApp,
        ),
      }),
    ),
  );

  ui.Heading('success!', {style: (content, style) => style.green(content)});

  if (localApp.extensions.length === 1) {
    ui.TextBlock(
      `Published extension ${ui.Code(
        localApp.extensions[0].configuration.name,
      )}!`,
    );
  } else {
    ui.TextBlock(`Published ${localApp.extensions.length} extensions:`);
    ui.List((List) => {
      for (const extension of localApp.extensions) {
        List.Item(extension.configuration.name);
      }
    });
  }
}

async function publishExtension(
  extension: LocalExtension,
  {
    ui,
    graphql,
    production,
  }: {
    ui: Ui;
    graphql: GraphQL;
    production?: ProductionClipsExtension;
  },
) {
  if (production == null) {
    throw new PrintableError(
      `No production extension found matching local extension ${ui.Code(
        extension.configuration.name,
      )}. Try running ${ui.Code(
        'watchapp push',
      )} first to stage your changes before running this command again.`,
    );
  }

  const {data} = await graphql.mutate(publishLatestClipsExtensionVersion, {
    variables: {extensionId: production.id},
  });

  if (data == null) {
    throw new PrintableError(
      `We were not able to create a production extension for ${ui.Code(
        extension.configuration.name,
      )}. This shouldn’t have happened... Maybe try running this command again in a moment?`,
    );
  }
}
