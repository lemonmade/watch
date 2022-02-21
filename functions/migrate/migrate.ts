import {execSync} from 'child_process';
import {getDatabaseUrl} from 'shared/utilities/database';

export async function handler() {
  execSync(
    'node /opt/nodejs/node_modules/prisma/build/index.js migrate deploy',
    {
      env: {...process.env, DATABASE_URL: await getDatabaseUrl()},
      stdio: 'inherit',
    },
  );
}
