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

const watchthrough = await prisma.watchThrough.delete({
  where: {
    id: '028cfcef-1e9d-47e9-9dc9-8d7c7464392e',
  },
});

console.log(watchthrough);
