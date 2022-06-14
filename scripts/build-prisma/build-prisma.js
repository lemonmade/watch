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

const outputRoot = resolve(root, 'build/prisma');

run();

async function run() {
  // const hash = createHash('sha256')
  //   .update(
  //     await readFile(resolve(root, 'prisma/schema.prisma'), {encoding: 'utf8'}),
  //   )
  //   .digest('hex');

  const target = process.env.PRISMA_BINARY_TARGET;

  if (!target) {
    throw new Error('process.env.PRISMA_BINARY_TARGET is not set');
  }

  await exec('node', [resolve(prismaEnginesRoot, 'download/index.js')], {
    // Generates the lambda migration engine
    // @see https://www.prisma.io/docs/reference/api-reference/environment-variables-reference#prisma_cli_binary_targets
    // @see https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#binarytargets-options
    // debian is for the docker build
    env: {
      ...process.env,
      PRISMA_CLI_BINARY_TARGETS: target,
    },
  });

  try {
    await remove(outputRoot);
  } catch {
    // intentional noop
  }

  await mkdirp(outputRoot);

  await copy(
    resolve(prismaClientRoot, '../.prisma'),
    resolve(outputRoot, '.prisma'),
    {
      recursive: true,
      overwrite: true,
      dereference: true,
      filter: omitQueryEngines,
    },
  );

  await copy(
    resolve(prismaEnginesRoot, `libquery_engine-${target}.so.node`),
    resolve(outputRoot, `.prisma/client/libquery_engine-${target}.so.node`),
    {
      dereference: true,
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
