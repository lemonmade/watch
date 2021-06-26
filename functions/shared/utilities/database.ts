import {PrismaClient as Prisma} from '@prisma/client';

export type {Prisma};

export async function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  if (!process.env.DATABASE_CREDENTIALS_SECRET) {
    throw new Error('Can’t find database URL!');
  }

  const {SecretsManager} = await import('aws-sdk');
  const secretsManager = new SecretsManager();

  const credentialsSecret = await secretsManager
    .getSecretValue({
      SecretId: process.env.DATABASE_CREDENTIALS_SECRET!,
    })
    .promise();

  const {password, username} = JSON.parse(
    credentialsSecret.SecretString ?? '{}',
  );

  if (password == null) {
    throw new Error('Could not fetch database credentials');
  }

  return `postgresql://${username}:${password}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}`;
}

const prismaPromise = process.env.DATABASE_CREDENTIALS_SECRET
  ? (async () => {
      return new Prisma({
        datasources: {
          db: {
            url: await getDatabaseUrl(),
          },
        },
      });
    })()
  : Promise.resolve(new Prisma());

export function createPrisma() {
  return prismaPromise;
}
