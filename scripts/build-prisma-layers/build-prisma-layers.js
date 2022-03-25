import {resolve, basename, dirname} from 'path';
import {fileURLToPath} from 'url';
import fsExtra from 'fs-extra';
import {execFile} from 'child_process';
import {promisify} from 'util';
import {createRequire} from 'module';

const {copy, mkdirp, remove} = fsExtra;

const exec = promisify(execFile);

const require = createRequire(import.meta.url);

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const prismaClientRoot = resolve(
  dirname(require.resolve('@prisma/client')),
  '..',
);
const prismaEnginesRoot = resolve(
  dirname(require.resolve('@prisma/engines')),
  '..',
);

const queryLayerOutput = resolve(root, 'build/layers/prisma-query');
const migrateLayerOutput = resolve(root, 'build/layers/prisma-migrate');

run();

async function run() {
  // const hash = createHash('sha256')
  //   .update(
  //     await readFile(resolve(root, 'prisma/schema.prisma'), {encoding: 'utf8'}),
  //   )
  //   .digest('hex');

  await exec('node', [resolve(prismaEnginesRoot, 'download/index.js')], {
    // Generates the lambda migration engine
    // @see https://www.prisma.io/docs/reference/api-reference/environment-variables-reference#prisma_cli_binary_targets
    env: {
      ...process.env,
      PRISMA_CLI_QUERY_ENGINE_TYPE: 'binary',
      PRISMA_CLI_BINARY_TARGETS: 'rhel-openssl-1.0.x',
    },
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
    dereference: true,
  });

  await Promise.all([
    // copy(
    //   resolve(prismaEnginesRoot, 'query-engine-rhel-openssl-1.0.x'),
    //   resolve(
    //     queryLayerOutput,
    //     'nodejs/node_modules/@prisma/client/query-engine-rhel-openssl-1.0.x',
    //   ),
    //   {
    //     dereference: true,
    //   },
    // ),
    copy(
      resolve(prismaEnginesRoot, 'libquery_engine-rhel-openssl-1.0.x.so.node'),
      resolve(
        queryLayerOutput,
        'nodejs/node_modules/prisma/libquery_engine-rhel-openssl-1.0.x.so.node',
      ),
      {
        dereference: true,
      },
    ),
    copy(
      resolve(prismaEnginesRoot, 'libquery_engine-rhel-openssl-1.0.x.so.node'),
      resolve(
        migrateLayerOutput,
        'nodejs/node_modules/prisma/libquery_engine-rhel-openssl-1.0.x.so.node',
      ),
      {
        dereference: true,
      },
    ),
    copy(
      resolve(prismaEnginesRoot, 'migration-engine-rhel-openssl-1.0.x'),
      resolve(
        migrateLayerOutput,
        'nodejs/node_modules/prisma/migration-engine-rhel-openssl-1.0.x',
      ),
      {
        dereference: true,
      },
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

/**
 * @param {string} output
 */
async function copyPrismaModules(output) {
  await mkdirp(output);

  await copy(
    resolve(root, 'node_modules/@prisma'),
    resolve(output, 'nodejs/node_modules/@prisma'),
    {
      recursive: true,
      overwrite: true,
      dereference: true,
      filter: omitQueryEngines,
    },
  );

  await copy(
    resolve(root, 'node_modules/prisma'),
    resolve(output, 'nodejs/node_modules/prisma'),
    {
      recursive: true,
      overwrite: true,
      dereference: true,
      filter: (file) =>
        omitQueryEngines(file) && !file.includes('/prisma/build/public/'),
    },
  );

  await copy(
    resolve(prismaClientRoot, '../.prisma'),
    resolve(output, 'nodejs/node_modules/.prisma'),
    {
      recursive: true,
      overwrite: true,
      dereference: true,
      filter: omitQueryEngines,
    },
  );
}

const PRISMA_BINARY_REGEX = /^(\w+[-_]engine|prisma-fmt)/;

/**
 * @param {string} file
 */
function omitQueryEngines(file) {
  return !PRISMA_BINARY_REGEX.test(basename(file));
}
