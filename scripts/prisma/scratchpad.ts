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

const watchthrough = await prisma.watchThrough.findFirstOrThrow({
  where: {
    series: {
      name: {
        contains: 'drag race uk',
      },
    },
  },
});

console.log(watchthrough);
