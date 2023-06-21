/* eslint no-console: off */

import 'dotenv/config';
import '@quilted/quilt/polyfills/fetch';
import {PrismaClient} from '@prisma/client';

import {EpisodeSelection} from '../../packages/api/source/index.ts';

import {sliceFromBuffer} from '../../global/slices.ts';
// import {updateSeries} from '../../global/tmdb.ts';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const episodes = new EpisodeSelection();
episodes
  .add({season: 2, episode: 11}, {season: 1})
  .add(`s3e2-s4`)
  .add('s2-s2e7');
console.log(episodes.toString(), [...episodes.ranges()]);
console.log('s1', episodes.nextEpisode('s1'));
console.log('s1e100', episodes.nextEpisode('s1e100'));
console.log('s2', episodes.nextEpisode('s2'));
console.log('s2e6', episodes.nextEpisode('s2e6'));
console.log('s2e7', episodes.nextEpisode('s2e7'));
console.log('s2e11', episodes.nextEpisode('s2e11'));
console.log('s3', episodes.nextEpisode('s3'));
console.log('s4', episodes.nextEpisode('s4'));
console.log('s5', episodes.nextEpisode('s5'));

// const watchThroughs = await prisma.watchThrough.findMany({});

// for (const watchThrough of watchThroughs) {
//   const from = sliceFromBuffer(watchThrough.from);
//   const to = sliceFromBuffer(watchThrough.to);

//   await prisma.watchThrough.update({
//     where: {id: watchThrough.id},
//     data: {
//       include: new EpisodeSelection({
//         from,
//         to,
//       }).toJSON(),
//     },
//   });
// }

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
