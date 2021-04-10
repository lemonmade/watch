import '@quilted/polyfills/fetch.node';

import {createGraphQL, createHttpFetch} from '@quilted/graphql';
import type {GraphQL} from '@quilted/graphql';

import {findMatchingProductionClipsExtension} from '../utilities';
import {loadProductionApp, loadLocalApp} from '../app';
import type {LocalExtension, ProductionClipsExtension} from '../app';

import publishLatestClipsExtensionVersion from './graphql/PublishLatestClipsExtensionVersionMutation.graphql';

export async function publish() {
  const graphql = createGraphQL({
    fetch: createHttpFetch({uri: 'https://watch.lemon.tools/api/graphql'}),
  });

  const localApp = await loadLocalApp();

  const productionApp = await loadProductionApp(localApp.configuration.id, {
    graphql,
  });

  for (const extension of localApp.extensions) {
    await publishExtension(extension, {
      graphql,
      production: findMatchingProductionClipsExtension(
        extension,
        productionApp,
      ),
    });
  }
}

async function publishExtension(
  extension: LocalExtension,
  {
    graphql,
    production,
  }: {
    graphql: GraphQL;
    production?: ProductionClipsExtension;
  },
) {
  if (production == null) {
    // eslint-disable-next-line no-console
    console.log(
      `No production extension found matching local extension ${JSON.stringify(
        extension.configuration.name,
      )}. Have you run \`watchapp push\` yet?`,
    );
    return;
  }

  const {data, error} = await graphql.mutate(
    publishLatestClipsExtensionVersion,
    {
      variables: {extensionId: production.id},
    },
  );

  if (error) {
    throw error;
  }

  if (data == null) {
    throw new Error('No data returned when publishing clips version');
  }

  // eslint-disable-next-line no-console
  console.log(
    `Deployed extension ${JSON.stringify(extension.configuration.name)}`,
  );
}
