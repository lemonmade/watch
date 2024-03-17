export async function createEdgeDatabaseConnection({url}: {url: string}) {
  const [{Client: PlanetScaleClient}, {PrismaClient}, {PrismaPlanetScale}] =
    await Promise.all([
      import('@planetscale/database'),
      import('@prisma/client/edge'),
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

  const prisma = new PrismaClient({adapter});

  return prisma;
}
