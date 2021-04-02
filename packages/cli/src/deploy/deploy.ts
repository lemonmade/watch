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
import type {LocalApp, LocalExtension, ProductionClipsExtension} from '../app';

import createClipsExtensionVersionMutation from './graphql/CreateClipsExtensionVersionMutation.graphql';
import createClipsExtensionAndInitialVersionMutation from './graphql/CreateClipsExtensionAndInitialVersionMutation.graphql';

export async function deploy() {
  const graphql = createGraphQL({
    fetch: createHttpFetch({uri: 'https://watch.lemon.tools/api/graphql'}),
  });

  const localApp = await loadLocalApp();

  verifyLocalBuild(localApp);

  const productionApp = await loadProductionApp(localApp.configuration.id, {
    graphql,
  });

  for (const extension of localApp.extensions) {
    await deployExtension(extension, {
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

async function deployExtension(
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
  const scriptContents = await readFile(path.join(directory, filename), {
    encoding: 'utf8',
  });
  const hash = createHash('sha256').update(scriptContents).digest('hex');

  if (production) {
    // eslint-disable-next-line no-console
    console.log(
      `Updating existing extension ${extension.configuration.name} (id: ${production.id})`,
    );

    const {data, error} = await graphql.mutate(
      createClipsExtensionVersionMutation,
      {
        variables: {
          extensionId: production.id,
          hash,
          name: extension.configuration.name,
        },
      },
    );

    if (error) {
      throw error;
    }

    if (data == null) {
      throw new Error('No data returned when creating clips version');
    }

    assetUploadUrl =
      data?.createClipsExtensionVersion.signedScriptUpload ?? undefined;
  } else {
    // eslint-disable-next-line no-console
    console.log(`Creating new extension ${extension.configuration.name}`);

    const {data, error} = await graphql.mutate(
      createClipsExtensionAndInitialVersionMutation,
      {
        variables: {
          appId: app.configuration.id,
          name: extension.configuration.name,
          initialVersion: {hash},
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
