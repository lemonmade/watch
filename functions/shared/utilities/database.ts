import prisma from '@prisma/client';
export type {PrismaClient as Prisma} from '@prisma/client';
import Env from '@quilted/quilt/env';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    DATABASE_URL: string;
    DATABASE_HOST: string;
    DATABASE_PORT: string;
    DATABASE_CREDENTIALS_SECRET?: string;
  }
}

const {PrismaClient} = prisma;

export async function getDatabaseUrl() {
  if (Env.DATABASE_URL) return Env.DATABASE_URL;

  if (!Env.DATABASE_CREDENTIALS_SECRET) {
    throw new Error('Can’t find database URL!');
  }

  const {SecretsManager} = await import('aws-sdk');
  const secretsManager = new SecretsManager();

  const credentialsSecret = await secretsManager
    .getSecretValue({
      SecretId: Env.DATABASE_CREDENTIALS_SECRET,
    })
    .promise();

  const {password, username} = JSON.parse(
    credentialsSecret.SecretString ?? '{}',
  );

  if (password == null) {
    throw new Error('Could not fetch database credentials');
  }

  return `postgresql://${username}:${password}@${Env.DATABASE_HOST}:${Env.DATABASE_PORT}`;
}

const prismaPromise = Env.DATABASE_CREDENTIALS_SECRET
  ? (async () => {
      return new PrismaClient({
        datasources: {
          db: {
            url: await getDatabaseUrl(),
          },
        },
      });
    })()
  : Promise.resolve(new PrismaClient());

export function createPrisma() {
  return prismaPromise;
}
