/* eslint import/no-extraneous-dependencies: off */

import {resolve, basename, dirname} from 'path';
import {copy, mkdirp, emptyDir} from 'fs-extra';
import exec from 'execa';

const root = resolve(__dirname, '..');
const buildDirectory = resolve(root, 'build/layers/prisma');

run();

async function run() {
  await mkdirp(buildDirectory);
  await emptyDir(buildDirectory);

  await copy(
    resolve(root, 'node_modules/@prisma'),
    resolve(buildDirectory, 'nodejs/node_modules/@prisma'),
    {recursive: true, overwrite: true},
  );

  await copy(
    resolve(root, 'node_modules/prisma'),
    resolve(buildDirectory, 'nodejs/node_modules/prisma'),
    {
      recursive: true,
      overwrite: true,
      filter: (file) =>
        omitNonLambdaQueryEngines(file) &&
        !file.includes('/prisma/build/public/'),
    },
  );

  await copy(
    resolve(root, 'node_modules/.prisma'),
    resolve(buildDirectory, 'nodejs/node_modules/.prisma'),
    {
      recursive: true,
      overwrite: true,
      dereference: true,
      filter: omitNonLambdaQueryEngines,
    },
  );

  await copy(
    resolve(root, 'prisma'),
    resolve(buildDirectory, 'nodejs/prisma'),
    {
      recursive: true,
      overwrite: true,
    },
  );

  const layerName = basename(buildDirectory);

  await exec('zip', ['-r', `../${layerName}.zip`, './nodejs'], {
    stdio: 'inherit',
    cwd: buildDirectory,
    env: {...process.env, DATABASE_URL: `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD_2}@${process.env.DB_HOST_2}:${process.env.DB_PORT}`}
  });
}

function omitNonLambdaQueryEngines(file: string) {
  const filename = basename(file);

  return (
    !filename.startsWith('query-engine') ||
    filename.startsWith('query-engine-rhel')
  );
}
