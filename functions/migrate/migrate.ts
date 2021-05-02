import {exec} from 'child_process';
import {getDatabaseUrl} from 'shared/utilities/database';

export default async function migrate() {
  exec('node /opt/nodejs/node_modules/prisma/build/index.js migrate deploy', {
    env: {...process.env, DATABASE_URL: await getDatabaseUrl()},
  });
}
