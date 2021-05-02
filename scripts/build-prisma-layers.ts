/* eslint import/no-extraneous-dependencies: off */

import {resolve, basename} from 'path';
import {copy, mkdirp, remove} from 'fs-extra';
import exec from 'execa';

const root = resolve(__dirname, '..');
const queryLayerOutput = resolve(root, 'build/layers/prisma-query');
const migrateLayerOutput = resolve(root, 'build/layers/prisma-migrate');

run();

async function run() {
  // const hash = createHash('sha256')
  //   .update(
  //     await readFile(resolve(root, 'prisma/schema.prisma'), {encoding: 'utf8'}),
  //   )
  //   .digest('hex');

  await exec('node', [require.resolve('@prisma/engines/download/index.js')], {
    // Generates the lambda migration engine
    // @see https://www.prisma.io/docs/reference/api-reference/environment-variables-reference#prisma_cli_binary_targets
    env: {...process.env, PRISMA_CLI_BINARY_TARGETS: 'rhel-openssl-1.0.x'},
  });

  try {
    await Promise.all([remove(queryLayerOutput), remove(migrateLayerOutput)]);
  } catch {
    // intentional noop
  }

  await copyPrismaModules(queryLayerOutput);

  await copy(queryLayerOutput, migrateLayerOutput, {
    recursive: true,
    overwrite: true,
  });

  await Promise.all([
    copy(
      resolve(
        root,
        'node_modules/@prisma/engines/query-engine-rhel-openssl-1.0.x',
      ),
      resolve(
        queryLayerOutput,
        'nodejs/node_modules/prisma/query-engine-rhel-openssl-1.0.x',
      ),
    ),
    copy(
      resolve(
        root,
        'node_modules/@prisma/engines/query-engine-rhel-openssl-1.0.x',
      ),
      resolve(
        migrateLayerOutput,
        'nodejs/node_modules/prisma/query-engine-rhel-openssl-1.0.x',
      ),
    ),
    copy(
      resolve(
        root,
        'node_modules/@prisma/engines/migration-engine-rhel-openssl-1.0.x',
      ),
      resolve(
        migrateLayerOutput,
        'nodejs/node_modules/prisma/migration-engine-rhel-openssl-1.0.x',
      ),
    ),
  ]);

  // await Promise.all(
  //   [queryLayerOutput, migrateLayerOutput].map(async (directory) => {
  //     const layerName = basename(directory);

  //     await exec('zip', ['-r', `../${layerName}-${hash}.zip`, './nodejs'], {
  //       stdio: 'inherit',
  //       cwd: directory,
  //     });
  //   }),
  // );
}

async function copyPrismaModules(output: string) {
  await mkdirp(output);

  await copy(
    resolve(root, 'node_modules/@prisma'),
    resolve(output, 'nodejs/node_modules/@prisma'),
    {recursive: true, overwrite: true, filter: omitQueryEngines},
  );

  await copy(
    resolve(root, 'node_modules/prisma'),
    resolve(output, 'nodejs/node_modules/prisma'),
    {
      recursive: true,
      overwrite: true,
      filter: (file) =>
        omitQueryEngines(file) && !file.includes('/prisma/build/public/'),
    },
  );

  await copy(
    resolve(root, 'node_modules/.prisma'),
    resolve(output, 'nodejs/node_modules/.prisma'),
    {
      recursive: true,
      overwrite: true,
      filter: omitQueryEngines,
    },
  );
}

const PRISMA_BINARY_REGEX = /^(\w+-engine|prisma-fmt)/;

function omitQueryEngines(file: string) {
  return !PRISMA_BINARY_REGEX.test(basename(file));
}
