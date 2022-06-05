import prisma from '@prisma/client';
export type {PrismaClient as Prisma} from '@prisma/client';
import Env from '@quilted/quilt/env';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    DATABASE_URL: string;
  }
}

const {PrismaClient} = prisma;

let prismaPromise: Promise<InstanceType<typeof PrismaClient>>;

export function createPrisma() {
  prismaPromise ??= Promise.resolve(
    new PrismaClient({
      datasources: {
        db: {
          url: Env.DATABASE_URL,
        },
      },
    }),
  );

  return prismaPromise;
}
