import type {PrismaClient} from '@prisma/client';
import Env from '@quilted/quilt/env';

declare module '@quilted/quilt/env' {
  interface EnvironmentVariables {
    DATABASE_URL: string;
  }
}

let prismaPromise: Promise<PrismaClient>;

export type {PrismaClient as Prisma};

export function createPrisma() {
  prismaPromise ??= (async () => {
    const {default: prisma} = await import('@prisma/client');
    const {PrismaClient} = prisma;

    return new PrismaClient({
      datasources: {
        db: {
          url: Env.DATABASE_URL,
        },
      },
    });
  })();

  return prismaPromise;
}
