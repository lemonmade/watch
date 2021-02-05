/* eslint-disable no-console */

import knex from 'knex';
import type {SQSHandler} from 'aws-lambda';

interface TmdbEpisode {
  episode_number: number;
  name: string;
  air_date?: string;
  overview: string;
  still_path?: string;
}

interface TmdbSeason {
  season_number: number;
  air_date: string;
  overview: string;
  poster_path?: string;
  episodes: TmdbEpisode[];
}

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
});

export const tmdbRefresher: SQSHandler = async (event) => {
  console.log(JSON.stringify(event, null, 2));

  try {
    await Promise.all(
      event.Records.map(async (record) => {
        const {
          messageAttributes: {
            tmdbId: {stringValue: tmdbId},
            name: {stringValue: name},
            id: {stringValue: id},
          },
        } = record;

        const result = await updateSeries({
          id: id!,
          name: name!,
          tmdbId: tmdbId!,
        });

        await fetch(
          'https://discordapp.com/api/webhooks/656640833063223325/1ofugrkDFpqaSAWvD6mLlg5EN3UDOfBdib4WKNE17Q5YxUoz8wpwuLoKCeaZJqCHyfeC',
          {
            method: 'POST',
            body: JSON.stringify({
              content: result ?? `Updated series: **${name}**`,
            }),
            headers: {'Content-Type': 'application/json'},
          },
        );
      }),
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
};

async function updateSeries({
  id: seriesId,
  tmdbId,
  name,
}: {
  id: string;
  tmdbId: string;
  name: string;
}) {
  const log = (message: string) => console.log(`[${name}] ${message}`);

  log(`Updating series`);

  const seasons = await db.select('*').from('Seasons').where({seriesId});
  const seasonToId = new Map(seasons.map(({id, number}) => [number, id]));
  const seasonNumbers = new Set(seasons.map((season) => season.number));
  const continuingSeasons = seasons
    .filter((season) => season.status === 'CONTINUING')
    .map((season) => season.number);
  const seasonsToUpdate = new Set(continuingSeasons);

  log(`Updating continuing seasons: ${[...continuingSeasons].join(', ')}`);
  const seriesResult = await tmdbFetch(`/tv/${tmdbId}`);
  log(JSON.stringify(seriesResult, null, 2));

  for (let i = 1; i <= seriesResult.number_of_seasons; i++) {
    if (!seasonNumbers.has(i)) {
      log(`Updating missing season: ${i}`);
      seasonsToUpdate.add(i);
    }
  }

  const seasonResults: TmdbSeason[] = await Promise.all(
    [...seasonsToUpdate].map((season) =>
      tmdbFetch(`/tv/${tmdbId}/season/${season}`),
    ),
  );

  const results: string[] = [];

  console.log(seasonsToUpdate, seasonNumbers, seriesResult.number_of_seasons);

  await db.transaction(async (trx) => {
    await trx
      .update({
        name: seriesResult.name,
        firstAired: tmdbAirDateToDate(seriesResult.first_air_date),
        status: tmdbStatusToEnum(seriesResult.status),
        overview: seriesResult.overview || null,
        poster: seriesResult.poster_path
          ? `https://image.tmdb.org/t/p/original${seriesResult.poster_path}`
          : null,
      })
      .into('Series')
      .where({id: seriesId});

    for (const season of seasonResults) {
      const id = seasonToId.get(season.season_number);

      if (id) {
        const isEnded =
          season.season_number === seriesResult.number_of_seasons &&
          (tmdbStatusToEnum(seriesResult.status) !== 'RETURNING' ||
            (seriesResult.next_episode_to_air == null &&
              isOlderThanThirtyDays(seriesResult.last_episode_to_air)));

        const [{firstAired}] = await trx
          .update(
            {
              number: season.season_number,
              firstAired: tmdbAirDateToDate(season.air_date),
              overview: season.overview ?? null,
              status: isEnded ? 'ENDED' : 'CONTINUING',
              poster: season.poster_path
                ? `https://image.tmdb.org/t/p/original${season.poster_path}`
                : null,
            },
            ['firstAired'],
          )
          .into('Seasons')
          .where({id});

        const episodesFromDb: {number: number}[] = await trx
          .select('*')
          .from('Episodes')
          .where({seasonId: id, seriesId});
        const episodesByNumber = new Set(
          episodesFromDb.map((episode) => episode.number),
        );
        const createdEpisodes = [];

        for (const episode of season.episodes) {
          if (episodesByNumber.has(episode.episode_number)) {
            await trx
              .update(
                {
                  number: episode.episode_number,
                  title: episode.name,
                  firstAired: tmdbAirDateToDate(episode.air_date),
                  overview: episode.overview || null,
                  still: episode.still_path
                    ? `https://image.tmdb.org/t/p/original${episode.still_path}`
                    : null,
                },
                ['id'],
              )
              .into('Episodes')
              .where({seasonId: id, seriesId, number: episode.episode_number});
          } else {
            const [{id: episodeId}] = await trx
              .insert(
                {
                  seriesId,
                  seasonId: id,
                  number: episode.episode_number,
                  title: episode.name,
                  firstAired: tmdbAirDateToDate(episode.air_date),
                  overview: episode.overview || null,
                  still: episode.still_path
                    ? `https://image.tmdb.org/t/p/original${episode.still_path}`
                    : null,
                },
                ['id'],
              )
              .into('Episodes');

            const watchThroughs: {id: string; index: number}[] = await trx
              .select({
                id: 'WatchThroughs.id',
                number: 'Episodes.number',
                index: 'WatchThroughEpisodes.index',
              })
              .from('WatchThroughs')
              .join(
                'WatchThroughEpisodes',
                'WatchThroughEpisodes.watchThroughId',
                '=',
                'WatchThroughs.id',
              )
              .join(
                'Episodes',
                'Episodes.id',
                '=',
                'WatchThroughEpisodes.episodeId',
              )
              .orderBy('Episodes.number', 'desc')
              .limit(1)
              .where({
                'WatchThroughs.seriesId': seriesId,
                'Episodes.seasonId': id,
                'Episodes.number': episode.episode_number - 1,
              });

            const newWatchThroughEpisodes = watchThroughs.map(
              (watchThrough) => ({
                watchThroughId: watchThrough.id,
                index: watchThrough.index + 1,
                episodeId,
              }),
            );

            await trx
              .insert(newWatchThroughEpisodes)
              .into('WatchThroughEpisodes');
            createdEpisodes.push(episodeId);
          }
        }

        results.push(
          `**${name}** (updated existing season)\nhttps://tv.lemon.tools/series/${seriesId}\nSeason ${
            season.season_number
          }${
            firstAired ? ` (started ${formatDate(firstAired)})` : ''
          } => \`${id}\`${
            createdEpisodes.length > 0
              ? `\n${createdEpisodes
                  .map((id) => `Episode => ${id}`)
                  .join('\n')}`
              : ''
          }`,
        );
      } else {
        const [{id: seasonId, firstAired}] = await trx
          .insert(
            {
              seriesId,
              number: season.season_number,
              status:
                season.season_number === seriesResult.number_of_seasons &&
                tmdbStatusToEnum(seriesResult.status) === 'RETURNING'
                  ? 'CONTINUING'
                  : 'ENDED',
              firstAired: tmdbAirDateToDate(season.air_date),
              overview: season.overview || null,
              poster: season.poster_path
                ? `https://image.tmdb.org/t/p/original${season.poster_path}`
                : null,
            },
            ['id', 'number', 'firstAired'],
          )
          .into('Seasons');

        const episodesToInsert = season.episodes.map((episode) => ({
          seriesId,
          seasonId,
          number: episode.episode_number,
          title: episode.name,
          firstAired: tmdbAirDateToDate(episode.air_date),
          overview: episode.overview || null,
          still: episode.still_path
            ? `https://image.tmdb.org/t/p/original${episode.still_path}`
            : null,
        }));

        const insertedEpisodes = await trx
          .insert(episodesToInsert, ['id'])
          .into('Episodes');

        console.log({insertedEpisodes});

        const [{id: watchThroughId}] = await trx
          .insert(
            {
              startedAt: new Date(),
              seriesId,
            },
            ['id'],
          )
          .into('WatchThroughs');

        await trx
          .insert(
            insertedEpisodes.map(({id: episodeId}, index) => ({
              index,
              episodeId,
              watchThroughId,
            })),
          )
          .into('WatchThroughEpisodes');

        results.push(
          `**${name}** (add new season)\nhttps://tv.lemon.tools/series/${seriesId}\nhttp://localhost:8082/watchthrough/${watchThroughId}\nSeason ${
            season.season_number
          }${
            firstAired ? ` (started ${formatDate(firstAired)})` : ''
          } => \`${seasonId}\`\n${episodesToInsert
            .map((episode) => `Episode ${episode.number} => `)
            .join('\n')}`,
        );
      }
    }

    const watchThroughsToCheck = await db
      .select({id: 'WatchThroughs.id', updatedAt: 'WatchThroughs.updatedAt'})
      .from('Seasons')
      .join('WatchThroughs', 'WatchThroughs.seriesId', '=', 'Seasons.seriesId')
      .where({'Seasons.id': seriesId, 'WatchThroughs.status': 'ONGOING'});

    await Promise.all(
      watchThroughsToCheck.map(({id, updatedAt}) =>
        updateWatchThrough(id, {db: trx, timestamp: updatedAt}),
      ),
    );
  });

  console.log(results.join('\n\n'));
  return results.join('\n\n');
}

function isOlderThanThirtyDays(episode: {air_date: string}) {
  if (episode == null) return false;

  const airDate = new Date(episode.air_date);
  return Date.now() - airDate.getTime() >= 30 * 24 * 60 * 60 * 1000;
}

type Database = ReturnType<typeof knex>;

async function updateWatchThrough(
  watchThroughId: string,
  {timestamp = 'now()', db}: {timestamp?: string; db: Database},
) {
  const finishedUpdate = (await watchThroughIsFinished(watchThroughId, {db}))
    ? {status: 'FINISHED', finishedAt: timestamp}
    : {};

  await db
    .from('WatchThroughs')
    .where({id: watchThroughId})
    .update({...finishedUpdate, updatedAt: timestamp});
}

async function watchThroughIsFinished(
  watchThroughId: string,
  {db}: {db: Database},
) {
  const unfinishedEpisodes = await unfinishedEpisodeCount(watchThroughId, {db});

  if (unfinishedEpisodes !== 0) return false;

  const watched = await db
    .from('WatchThroughEpisodes')
    .select('*')
    .where({watchThroughId})
    .andWhere((clause) => clause.whereNotNull('watchId'))
    .orderBy('index', 'desc')
    .limit(1);

  if (watched == null) return false;

  const [season] = await db
    .from('Episodes')
    .select({id: 'Seasons.id', status: 'Seasons.status'})
    .join('Seasons', 'Seasons.id', '=', 'Episodes.seasonId')
    .whereIn('Episodes.id', [watched]);

  return season != null && season.status === 'ENDED';
}

async function unfinishedEpisodeCount(
  watchThroughId: string,
  {db}: {db: Database},
) {
  const [{count}] = (await db
    .from('WatchThroughEpisodes')
    .join('Episodes', 'Episodes.id', '=', 'WatchThroughEpisodes.episodeId')
    .where((clause) => {
      clause
        .where({watchThroughId})
        .whereNull('WatchThroughEpisodes.watchId')
        .whereNull('WatchThroughEpisodes.skipId');
    })
    .where(
      'Episodes.firstAired',
      '<',
      db.raw(`CURRENT_DATE + interval '1 day'`),
    )
    .count({count: 'WatchThroughEpisodes.id'})) as {count: number}[];

  return parseInt(String(count), 10);
}

async function tmdbFetch(path: string) {
  const fetched = await fetch(`https://api.themoviedb.org/3${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
  });

  return fetched.json();
}

function tmdbAirDateToDate(date?: string) {
  if (!date) {
    return null;
  }

  const match = /(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2})/.exec(
    date,
  );

  if (match == null) {
    return null;
  }

  const {year, month, day} = match.groups!;
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
  );
}

function tmdbStatusToEnum(status: string) {
  switch (status) {
    case 'Returning Series':
      return 'RETURNING';
    case 'Ended':
      return 'ENDED';
    case 'Canceled':
      return 'CANCELLED';
    default: {
      throw new Error(`Unrecognized status: ${status}`);
    }
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat().format(new Date(date));
}
