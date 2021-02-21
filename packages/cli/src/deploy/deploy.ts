import '@quilted/polyfills/fetch.node';

import {createReadStream, statSync} from 'fs';
import {createGraphQL, createHttpFetch} from '@quilted/graphql';

import createClipsExtensionVersionMutation from './graphql/CreateClipsExtensionVersionMutation.graphql';

export async function deploy() {
  const graphql = createGraphQL({
    fetch: createHttpFetch({uri: 'https://api.lemon.tools/watch'}),
  });

  const {data, error} = await graphql.mutate(
    createClipsExtensionVersionMutation,
    {
      variables: {extensionId: '', hash: '', name: ''},
    },
  );

  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
    return;
  }

  if (data == null) {
    // eslint-disable-next-line no-console
    console.error('No data');
    process.exitCode = 1;
    return;
  }

  const signedUrl = data?.createClipsExtensionVersion.signedScriptUpload;

  if (signedUrl == null) {
    // eslint-disable-next-line no-console
    console.error('No signed URL');
    process.exitCode = 1;
    return;
  }

  await fetch(signedUrl, {
    method: 'PUT',
    body: createReadStream('') as any,
    headers: {
      'Content-Length': String(statSync('').size),
    },
  });
}
