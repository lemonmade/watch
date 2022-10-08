/* eslint no-console: off */

import 'dotenv/config';
import {PrismaClient} from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

console.log(
  await prisma.series.findMany({
    take: 10,
    where: {name: {contains: 'drag Race'}},
  }),
);
