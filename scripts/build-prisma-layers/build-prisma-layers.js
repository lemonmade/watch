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

const flyOutput = resolve(root, 'build/fly/prisma');
const lambdaQueryLayerOutput = resolve(
  root,
  'build/lambda/layers/prisma-query',
);

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
    // @see https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#binarytargets-options
    // debian is for the docker build
    env: {
      ...process.env,
      PRISMA_CLI_BINARY_TARGETS: 'rhel-openssl-1.0.x,debian-openssl-1.1.x',
    },
  });

  try {
    await Promise.all([remove(flyOutput), remove(lambdaQueryLayerOutput)]);
  } catch {
    // intentional noop
  }

  await Promise.all([
    copyPrismaModulesForFly(flyOutput),
    copyPrismaModulesForLambda(lambdaQueryLayerOutput),
  ]);

  await Promise.all([
    // copy(
    //   resolve(prismaEnginesRoot, 'query-engine-rhel-openssl-1.0.x'),
    //   resolve(
    //     lambdaQueryLayerOutput,
    //     'nodejs/node_modules/@prisma/client/query-engine-rhel-openssl-1.0.x',
    //   ),
    //   {
    //     dereference: true,
    //   },
    // ),
    copy(
      resolve(
        prismaEnginesRoot,
        'libquery_engine-debian-openssl-1.1.x.so.node',
      ),
      resolve(
        flyOutput,
        '.prisma/client/libquery_engine-debian-openssl-1.1.x.so.node',
      ),
      {
        dereference: true,
      },
    ),
    copy(
      resolve(prismaEnginesRoot, 'libquery_engine-rhel-openssl-1.0.x.so.node'),
      resolve(
        lambdaQueryLayerOutput,
        'nodejs/node_modules/@prisma/client/runtime/libquery_engine-rhel-openssl-1.0.x.so.node',
      ),
      {
        dereference: true,
      },
    ),
  ]);
}

/**
 * @param {string} output
 */
async function copyPrismaModulesForFly(output) {
  await mkdirp(output);

  await copy(
    resolve(root, 'node_modules/@prisma'),
    resolve(output, '@prisma'),
    {
      recursive: true,
      overwrite: true,
      dereference: true,
      filter: omitQueryEngines,
    },
  );

  await copy(
    resolve(prismaClientRoot, '../.prisma'),
    resolve(output, '.prisma'),
    {
      recursive: true,
      overwrite: true,
      dereference: true,
      filter: omitQueryEngines,
    },
  );
}

/**
 * @param {string} output
 */
async function copyPrismaModulesForLambda(output) {
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
