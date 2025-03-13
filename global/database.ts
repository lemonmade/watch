import type {PrismaClient} from '@prisma/client';

const CACHE = new Map<string, Promise<PrismaClient>>();

export type {PrismaClient};

export async function createEdgeDatabaseConnection({url}: {url: string}) {
  let prismaPromise = CACHE.get(url);

  if (prismaPromise) {
    const prisma = await prismaPromise;
    return prisma;
  }

  prismaPromise = (async () => {
    const [{Client: PlanetScaleClient}, {PrismaClient}, {PrismaPlanetScale}] =
      await Promise.all([
        import('@planetscale/database'),
        import('@prisma/client'),
        import('@prisma/adapter-planetscale'),
      ]);

    const client = new PlanetScaleClient({
      url,
      // @see https://github.com/cloudflare/workerd/issues/698
      fetch(url, init) {
        if (init) delete init['cache'];
        return fetch(url, init);
      },
    });

    const adapter = new PrismaPlanetScale(client);

    return new PrismaClient({adapter});
  })();

  CACHE.set(url, prismaPromise);

  const prisma = await prismaPromise;
  return prisma;
}
