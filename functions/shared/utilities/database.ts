// eslint-disable-next-line import/no-extraneous-dependencies
import {PrismaClient as Prisma} from '@prisma/client';

export type {Prisma};

const prismaPromise = process.env.DATABASE_CREDENTIALS_SECRET
  ? (async () => {
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
        throw new Error('Could not fetch credentials');
      }

      return new Prisma({
        datasources: {
          db: {
            url: `postgresql://${username}:${password}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}`,
          },
        },
      });
    })()
  : Promise.resolve(new Prisma());

export function createPrisma() {
  return prismaPromise;
}
