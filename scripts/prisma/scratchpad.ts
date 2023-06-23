/* eslint no-console: off */

import 'dotenv/config';
import '@quilted/quilt/polyfills/fetch';
import {PrismaClient} from '@prisma/client';

// import {updateSeries} from '../../global/tmdb.ts';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// const allSeries = await prisma.series.findMany({
//   where: {
//     id: {
//       in: [
//         'fafe26ed-43c7-4aaa-abf4-290d5ac9bd8b',
//         'b5f82472-85a9-4e37-bce6-538c31b39090',
//       ],
//     },
//   },
// });

// for (const series of allSeries) {
//   try {
//     await updateSeries({
//       id: series.id,
//       tmdbId: series.tmdbId,
//       prisma,
//       name: series.name,
//       accessToken: process.env.TMDB_ACCESS_TOKEN,
//     });
//   } catch (error) {
//     console.error(`Failed on ${series.name} (${series.id})`);
//     console.error(error);
//   }
// }

// const watchthrough = await prisma.watchThrough.delete({
//   where: {
//     id: '028cfcef-1e9d-47e9-9dc9-8d7c7464392e',
//   },
// });

// console.log(watchthrough);
