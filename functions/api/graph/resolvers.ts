import type {IResolvers} from 'graphql-tools';
import fetch from 'node-fetch';

import {createSignedToken, removeAuthCookies} from 'shared/utilities/auth';
import {Table} from 'shared/utilities/database';

import type {
  CreateClipsInitialVersion,
  ClipsExtensionPointSupportInput,
  ClipsExtensionConfigurationSchemaFieldsInput,
  ClipsExtensionConfigurationStringInput,
} from './schema-input-types';
import {Context} from './context';
import {enqueueSendEmail} from './utilities/email';
import {ClipsExtensionPointConditionInput} from './schema';

type Resolver<Source = never> = IResolvers<Source, Context>;

export const Query: Resolver = {
  me(_, __, {prisma, user}) {
    return prisma.user.findFirst({where: {id: user.id}});
  },
  async search(_, {query}: {query?: string}, context) {
    if (!query?.length) {
      return {series: []};
    }

    const {results} = await tmdbFetch<{results: any[]}>(
      `/search/tv?query=${encodeURIComponent(query)}`,
    );
    const cappedResults = results.slice(0, 5);
    const existingSeries =
      cappedResults.length > 0
        ? await context.prisma.series.findMany({
            where: {tmdbId: {in: cappedResults.map(({id}) => String(id))}},
          })
        : [];

    const idToResult = new Map(
      existingSeries.map((series) => [series.tmdbId, series]),
    );
    const unmatchedSeries = cappedResults.filter(
      ({id}) => !idToResult.has(String(id)),
    );

    await Promise.all(
      unmatchedSeries.map(async (unmatchedSeries) => {
        const series = await loadTmdbSeries(unmatchedSeries.id, context);
        idToResult.set(series.tmdbId, series);
      }),
    );

    const returnedSeries = cappedResults.map(({id}) =>
      idToResult.get(String(id)),
    );

    return {series: returnedSeries};
  },
  watch(_, {id}: {id: string}, {watchLoader}) {
    return watchLoader.load(fromGid(id).id);
  },
  series(_, {id}: {id: string}, {prisma}) {
    return prisma.series.findFirst({where: {id: fromGid(id).id}});
  },
  subscription(_, {id}: {id: string}, {seriesSubscriptionsLoader}) {
    return seriesSubscriptionsLoader.load(fromGid(id).id);
  },
  async subscriptions(_, __, {db, seriesSubscriptionsLoader, user}) {
    const seriesSubscriptions = await db
      .select('id')
      .from(Table.SeriesSubscriptions)
      .limit(50)
      .where({userId: user.id});

    return Promise.all(
      seriesSubscriptions.map(({id}) => seriesSubscriptionsLoader.load(id)),
    );
  },
  watchThrough(_, {id}: {id: string}, {watchThroughLoader}) {
    return watchThroughLoader.load(fromGid(id).id);
  },
  async watchThroughs(
    _,
    {status = 'ONGOING'}: {status?: string},
    {db, watchThroughLoader, user},
  ) {
    const watchThroughs = await db
      .select('id')
      .from(Table.WatchThroughs)
      .where({status, userId: user.id})
      .limit(50);

    return Promise.all(
      watchThroughs.map(({id}) => watchThroughLoader.load(id)),
    );
  },
  app(_, {id}: {id: string}, {prisma}) {
    return prisma.app.findFirst({where: {id: fromGid(id).id}});
  },
  async clipsInstallations(
    _,
    {
      extensionPoint,
      conditions = [],
    }: {
      extensionPoint: string;
      conditions?: ClipsExtensionPointConditionInput[];
    },
    {user, prisma},
  ) {
    const installations = await prisma.clipsExtensionInstallation.findMany({
      where: {
        userId: user.id,
        extensionPoint,
        extension: {activeVersion: {status: 'PUBLISHED'}},
      },
      include: {
        extension: {
          select: {activeVersion: {select: {status: true, supports: true}}},
        },
      },
      take: 50,
    });

    return installations.filter((installation) => {
      const version = installation.extension.activeVersion;

      if (version == null || version.status !== 'PUBLISHED') {
        return false;
      }

      return conditions.every((condition) => {
        if (condition.seriesId) {
          return ((version.supports as any[]) ?? []).every((supports: any) => {
            return (
              extensionPoint !== supports.extensionPoint ||
              supports.conditions.every(
                (supportCondition: any) =>
                  supportCondition.type !== 'series' ||
                  supportCondition.id === condition.seriesId,
              )
            );
          });
        }

        throw new Error();
      });
    });
  },
  clipsInstallation(_, {id}: {id: string}, {prisma}) {
    return prisma.clipsExtensionInstallation.findFirst({
      where: {id: fromGid(id).id},
    });
  },
};

interface Slice {
  episodeNumber: number;
  seasonNumber: number;
}

export const Mutation: Resolver = {
  async signIn(
    _,
    {email, redirectTo}: {email: string; redirectTo?: string},
    {prisma},
  ) {
    const user = await prisma.user.findFirst({where: {email}});

    if (user == null) {
      // Need to make this take roughly the same amount of time as
      // enqueuing a message, which can sometimes take a long time...
      return {email};
    }

    await enqueueSendEmail('signIn', {
      token: createSignedToken(
        {redirectTo},
        {subject: email, expiresIn: '15 minutes'},
      ),
      userEmail: email,
    });
    return {email};
  },
  async signOut(_, __, {user, response, request}) {
    removeAuthCookies(response, {request});
    return {userId: toGid(user.id, 'User')};
  },
  async createAccount(
    _,
    {email, redirectTo}: {email: string; redirectTo?: string},
    {prisma},
  ) {
    const user = await prisma.user.findFirst({
      where: {email},
      select: {id: true},
    });

    if (user != null) {
      await enqueueSendEmail('signIn', {
        token: createSignedToken(
          {redirectTo},
          {subject: email, expiresIn: '15 minutes'},
        ),
        userEmail: email,
      });

      return {email};
    }

    await enqueueSendEmail('welcome', {
      token: createSignedToken(
        {redirectTo},
        {subject: email, expiresIn: '15 minutes'},
      ),
      userEmail: email,
    });

    return {email};
  },
  async deleteAccount(_, __, {prisma, user}) {
    const deleted = await prisma.user.delete({where: {id: user.id}});
    return {deletedId: toGid(deleted.id, 'User')};
  },
  async disconnectGithubAccount(_, __, {prisma, user}) {
    const githubAccount = await prisma.githubAccount.findFirst({
      where: {userId: user.id},
    });

    if (githubAccount) {
      await prisma.githubAccount.delete({where: {id: githubAccount.id}});
    }

    return {deletedAccount: githubAccount};
  },
  async watchEpisode(
    _,
    {
      episode: episodeGid,
      watchThrough: watchThroughGid,
      rating,
      notes,
      startedAt,
      finishedAt,
    }: {
      episode: string;
      watchThrough?: string;
      rating?: number;
      notes?: string;
      startedAt?: string;
      finishedAt?: string;
    },
    {db, prisma, user, watchLoader, episodeLoader, watchThroughLoader},
  ) {
    const episodeId = episodeGid && fromGid(episodeGid).id;
    const watchThroughId = watchThroughGid && fromGid(watchThroughGid).id;

    const [watchId] = await db
      .insert({
        episodeId,
        watchThroughId,
        rating,
        notes,
        startedAt,
        finishedAt,
        userId: user.id,
      })
      .into(Table.Watches)
      .returning<string>('id');

    if (watchThroughId && watchId) {
      await db
        .update({watchId})
        .from(Table.WatchThroughEpisodes)
        .where({watchThroughId, episodeId});

      await updateWatchThrough(watchThroughId, {
        db,
        prisma,
        timestamp: startedAt ?? finishedAt,
      });
    }

    const [watch, episode, watchThrough] = await Promise.all([
      watchLoader.load(watchId),
      episodeLoader.load(episodeId),
      watchThroughId
        ? watchThroughLoader.load(watchThroughId)
        : Promise.resolve(null),
    ]);

    return {watch, episode, watchThrough};
  },
  async skipEpisode(
    _,
    {
      episode: episodeGid,
      watchThrough: watchThroughGid,
      notes,
      at,
    }: {episode: string; watchThrough?: string; notes?: string; at?: string},
    {db, prisma, user, skipLoader, episodeLoader, watchThroughLoader},
  ) {
    const episodeId = episodeGid && fromGid(episodeGid).id;
    const watchThroughId = watchThroughGid && fromGid(watchThroughGid).id;

    const [skipId] = await db
      .insert({
        episodeId,
        watchThroughId,
        notes,
        at,
        userId: user.id,
      })
      .into(Table.Skips)
      .returning<string>('id');

    if (watchThroughId && skipId) {
      await db
        .update({skipId})
        .from(Table.WatchThroughEpisodes)
        .where({watchThroughId, episodeId});

      await updateWatchThrough(watchThroughId, {
        db,
        prisma,
        timestamp: at,
      });
    }

    const [skip, episode, watchThrough] = await Promise.all([
      skipLoader.load(skipId),
      episodeLoader.load(episodeId),
      watchThroughId
        ? watchThroughLoader.load(watchThroughId)
        : Promise.resolve(null),
    ]);

    return {skip, episode, watchThrough};
  },
  async stopWatchThrough(
    _,
    {id: gid}: {id: string},
    {db, watchThroughLoader, user},
  ) {
    const {id} = fromGid(gid);

    await db
      .from(Table.WatchThroughs)
      .update({status: 'STOPPED'})
      .where({id, userId: user.id});
    const watchThrough = await watchThroughLoader.load(id);

    return {watchThrough};
  },
  async startWatchThrough(
    _,
    {
      series: seriesGid,
      seasons: seasonGids,
      episodes: episodeGids,
      includeSpecials = false,
    }: {
      series: string;
      seasons?: string[];
      episodes?: string[];
      includeSpecials?: boolean;
    },
    {db, user, watchThroughLoader},
  ) {
    const {id: seriesId} = fromGid(seriesGid);

    const watchThroughId = await db.transaction(async (trx) => {
      const episodes = [
        ...((episodeGids && episodeGids.map((gid) => fromGid(gid).id)) || []),
      ];

      if (seasonGids) {
        episodes.push(
          ...((await trx
            .select({id: 'Episodes.id'})
            .from(Table.Episodes)
            .join('Seasons', 'Seasons.id', '=', 'Episodes.seasonId')
            .whereIn(
              'Episodes.seasonId',
              seasonGids.map((gid) => fromGid(gid).id),
            )
            .orderBy(['Seasons.number', 'Episodes.number'])) as {
            id: string;
          }[]).map(({id}) => id),
        );
      }

      if (seasonGids == null && episodeGids == null) {
        episodes.push(
          ...((await trx
            .select({id: 'Episodes.id'})
            .from(Table.Episodes)
            .join('Seasons', 'Seasons.id', '=', 'Episodes.seasonId')
            .where((clause) => {
              clause.where({'Episodes.seriesId': seriesId});

              if (!includeSpecials) {
                clause.whereNot({'Seasons.number': 0});
              }
            })
            .orderBy(['Seasons.number', 'Episodes.number'])) as {
            id: string;
          }[]).map(({id}) => id),
        );
      }

      const [{id: watchThroughId}] = await trx
        .insert(
          {
            startedAt: new Date(),
            seriesId,
            userId: user.id,
          },
          ['id'],
        )
        .into(Table.WatchThroughs);

      await trx
        .insert(
          episodes.map((episodeId, index) => ({
            index,
            episodeId,
            watchThroughId,
          })),
        )
        .into(Table.WatchThroughEpisodes);

      return watchThroughId;
    });

    const watchThrough = await watchThroughLoader.load(watchThroughId);

    return {watchThrough};
  },
  async subscribeToSeries(_, {id: seriesGid}: {id: string}, {db, user}) {
    const {id: seriesId} = fromGid(seriesGid);

    const [subscription] = await db
      .insert({seriesId, userId: user.id})
      .into(Table.SeriesSubscriptions)
      .returning('*');

    return {subscription};
  },
  async deleteWatch(
    _,
    {id: gid}: {id: string},
    {db, user, watchThroughLoader},
  ) {
    const {id} = fromGid(gid);
    const [{watchThroughId}] = await db
      .select('watchThroughId')
      .from(Table.Watches)
      .where({id, userId: User.id});
    await db.from(Table.Watches).where({id, userId: user.id}).delete();

    return {
      deletedWatchId: gid,
      watchThrough: watchThroughId
        ? watchThroughLoader.load(watchThroughId)
        : null,
    };
  },
  async deleteWatchThrough(_, {id: gid}: {id: string}, {db, user}) {
    const {id} = fromGid(gid);
    await db.from(Table.WatchThroughs).where({id, userId: user.id}).delete();
    return {deletedWatchThroughId: gid};
  },
  async updateSeason(
    _,
    {
      id: gid,
      status,
    }: {id: string; status: import('@prisma/client').SeasonStatus},
    {db, prisma},
  ) {
    const {id} = fromGid(gid);
    const season = await prisma.season.update({where: {id}, data: {status}});

    if (status === 'ENDED') {
      const watchThroughsToCheck = await db
        .select({id: 'WatchThroughs.id', updatedAt: 'WatchThroughs.updatedAt'})
        .from(Table.Season)
        .join(
          'WatchThroughs',
          'WatchThroughs.seriesId',
          '=',
          'Seasons.seriesId',
        )
        .where({'Seasons.id': id, 'WatchThroughs.status': 'ONGOING'});

      await Promise.all(
        watchThroughsToCheck.map(({id, updatedAt}) =>
          updateWatchThrough(id, {db, prisma, timestamp: updatedAt}),
        ),
      );
    }

    return {season};
  },
  async watchEpisodesFromSeries(
    _,
    {
      series: seriesGid,
      slice,
    }: {series: string; slice?: {from?: Slice; to?: Slice}},
    {db, user, seriesLoader},
  ) {
    const {id: seriesId} = fromGid(seriesGid);

    await db.transaction(async (trx) => {
      const episodes = (await trx
        .select({id: 'Episodes.id'})
        .from(Table.Episodes)
        .join('Seasons', 'Seasons.id', '=', 'Episodes.seasonId')
        .where((clause) => {
          clause.where({'Episodes.seriesId': seriesId});

          const {from, to} = slice ?? {};

          if (from) {
            clause.andWhere((clause) => {
              clause
                .where('Seasons.number', '>', from.seasonNumber)
                .orWhere((clause) => {
                  clause
                    .where('Seasons.number', '=', from.seasonNumber)
                    .andWhere('Episodes.number', '>', from.episodeNumber - 1);
                });
            });
          }

          if (to) {
            clause.andWhere((clause) => {
              clause
                .where('Seasons.number', '<', to.seasonNumber)
                .orWhere((clause) => {
                  clause
                    .where('Seasons.number', '=', to.seasonNumber)
                    .andWhere('Episodes.number', '<', to.episodeNumber + 1);
                });
            });
          }
        })) as {id: string}[];

      await trx
        .insert(
          episodes.map(({id: episodeId}) => ({
            episodeId,
            userId: user.id,
          })),
        )
        .into(Table.Watches);
    });

    const series = await seriesLoader.load(seriesId);
    return {series};
  },
  createApp(_, {name}: {name: string}, {prisma}) {
    return prisma.app.create({data: {name}});
  },
  async deleteApp(_, {id}: {id: string}, {prisma}) {
    await prisma.app.delete({where: {id: fromGid(id).id}});
    return {deletedId: id};
  },
  updateApp(_, {id, name}: {id: string; name?: string}, {prisma}) {
    return prisma.app.update({where: {id: fromGid(id).id}, data: {name}});
  },
  async createClipsExtension(
    _,
    {
      name,
      appId,
      initialVersion,
    }: {
      appId: string;
      name: string;
      initialVersion?: CreateClipsInitialVersion;
    },
    {prisma},
  ) {
    const {app, ...extension} = await prisma.clipsExtension.create({
      data: {
        name,
        appId: fromGid(appId).id,
      },
      include: {app: true},
    });

    if (initialVersion == null) {
      return {app, extension};
    }

    const {
      version: versionInput,
      signedScriptUpload,
    } = await createStagedClipsVersion({
      appId: fromGid(appId).id,
      extensionId: extension.id,
      extensionName: name,
      ...initialVersion,
    });

    const version = await prisma.clipsExtensionVersion.create({
      data: {...versionInput, extensionId: extension.id, status: 'BUILDING'},
    });

    return {
      app,
      extension,
      version,
      signedScriptUpload,
    };
  },
  async deleteClipsExtension(_, {id}: {id: string}, {prisma}) {
    const {app} = await prisma.clipsExtension.delete({
      where: {id: fromGid(id).id},
      select: {app: true},
    });

    return {deletedId: id, app};
  },
  updateClipsExtension(_, {id, name}: {id: string; name?: string}, {prisma}) {
    if (name == null) {
      throw new Error();
    }

    return prisma.clipsExtension.update({
      data: {name},
      where: {id: fromGid(id).id},
    });
  },
  async pushClipsExtension(
    _,
    {
      extensionId,
      hash,
      name,
      translations,
      supports,
      configurationSchema,
    }: {
      extensionId: string;
      hash: string;
      name?: string;
      translations?: string;
      supports?: ClipsExtensionPointSupportInput[];
      configurationSchema?: ClipsExtensionConfigurationSchemaFieldsInput[];
    },
    {prisma},
  ) {
    const id = fromGid(extensionId).id;

    const existingVersion = await prisma.clipsExtensionVersion.findFirst({
      where: {extensionId: id, status: 'BUILDING'},
      select: {id: true},
    });

    const extension = await prisma.clipsExtension.findFirst({
      where: {id},
      rejectOnNotFound: true,
    });

    const {
      version: versionInput,
      signedScriptUpload,
    } = await createStagedClipsVersion({
      hash,
      appId: extension.appId,
      extensionId: id,
      extensionName: name ?? extension.name,
      translations,
      supports,
      configurationSchema,
    });

    if (existingVersion) {
      const version = await prisma.clipsExtensionVersion.update({
        where: {id: existingVersion.id},
        data: {...versionInput},
      });

      return {
        version,
        signedScriptUpload,
        extension,
      };
    }

    const version = await prisma.clipsExtensionVersion.create({
      data: {...versionInput, extensionId: id, status: 'BUILDING'},
    });

    return {
      extension,
      version,
      signedScriptUpload,
    };
  },
  async publishLatestClipsExtensionVersion(
    _,
    {extensionId}: {extensionId: string},
    {prisma},
  ) {
    const result = await prisma.clipsExtensionVersion.findFirst({
      where: {status: 'BUILDING', extensionId: fromGid(extensionId).id},
      include: {extension: true},
    });

    if (result == null) {
      return {};
    }

    const {extension, ...version} = result;

    await prisma.$transaction([
      prisma.clipsExtensionVersion.update({
        where: {id: version.id},
        data: {status: 'PUBLISHED'},
      }),
      prisma.clipsExtension.update({
        where: {id: extension.id},
        data: {activeVersionId: version.id},
      }),
    ]);

    return {
      version,
      extension,
    };
  },
  async installApp(_, {id}: {id: string}, {user, prisma}) {
    const {app, ...installation} = await prisma.appInstallation.create({
      data: {appId: fromGid(id).id, userId: user.id},
      include: {app: true},
    });

    return {app, installation};
  },
  async installClipsExtension(
    _,
    {
      id,
      extensionPoint,
      configuration,
    }: {id: string; extensionPoint: string; configuration?: string},
    {user, prisma},
  ) {
    const extension = await prisma.clipsExtension.findFirst({
      where: {id: fromGid(id).id},
      rejectOnNotFound: true,
    });

    const appInstallation = await prisma.appInstallation.findFirst({
      where: {userId: user.id, appId: extension.appId},
    });

    if (appInstallation == null) {
      throw new Error(`You must install the app for extension ${id} first`);
    }

    const installation = await prisma.clipsExtensionInstallation.create({
      data: {
        userId: user.id,
        extensionId: extension.id,
        extensionPoint,
        configuration,
        appInstallationId: appInstallation.id,
      },
    });

    return {
      extension,
      installation,
    };
  },
  async updateClipsExtensionInstallation(
    _,
    {id, configuration}: {id: string; configuration?: string},
    {user, prisma},
  ) {
    const installationDetails = await prisma.clipsExtensionInstallation.findFirst(
      {
        where: {id: fromGid(id).id},
        select: {id: true, userId: true},
        rejectOnNotFound: true,
      },
    );

    if (installationDetails.userId !== user.id) {
      throw new Error();
    }

    const {
      extension,
      ...installation
    } = await prisma.clipsExtensionInstallation.update({
      where: {id: installationDetails.id},
      include: {extension: true},
      data: {
        configuration,
      },
    });

    return {
      extension,
      installation,
    };
  },
};

export const Watchable: Resolver = {
  __resolveType: resolveType,
};

export const Reviewable: Resolver = {
  __resolveType: resolveType,
};

export const WatchThroughEpisodeAction: Resolver = {
  __resolveType: resolveType,
};

export const AppExtension: Resolver = {
  __resolveType: resolveType,
};

export const AppExtensionInstallation: Resolver = {
  __resolveType: resolveType,
};

export const User: Resolver<import('@prisma/client').User> = {
  id: ({id}) => toGid(id, 'User'),
  githubAccount: async ({id}, _, {prisma}) => {
    const account = await prisma.githubAccount.findFirst({where: {userId: id}});
    return account;
  },
};

export const GithubAccount: Resolver<import('@prisma/client').GithubAccount> = {
  avatarImage: ({avatarUrl}: {avatarUrl?: string}) => {
    return {source: avatarUrl};
  },
};

export const Series: Resolver<import('@prisma/client').Series> = {
  id: ({id}) => toGid(id, 'Series'),
  season({id}, {number}: {number: number}, {prisma}) {
    return prisma.season.findFirst({where: {seriesId: id, number}});
  },
  seasons({id}, _, {prisma}) {
    return prisma.season.findMany({where: {seriesId: id}});
  },
  episode(
    {id},
    {number, seasonNumber}: {number: number; seasonNumber: number},
    {prisma},
  ) {
    return prisma.episode.findFirst({
      where: {number, season: {number: seasonNumber, seriesId: id}},
    });
  },
  episodes({id}, _, {prisma}) {
    return prisma.episode.findMany({take: 50, where: {season: {seriesId: id}}});
  },
  poster({posterUrl}) {
    return posterUrl ? {source: posterUrl} : null;
  },
};

export const Season: Resolver<import('@prisma/client').Season> = {
  id: ({id}) => toGid(id, 'Season'),
  series({seriesId}, _, {prisma}) {
    return prisma.series.findFirst({where: {id: seriesId}});
  },
  async episodes({id}, _, {prisma}) {
    const episodes = await prisma.episode.findMany({
      where: {seasonId: id},
      orderBy: {number: 'asc'},
    });

    return episodes;
  },
  poster({posterUrl}) {
    return posterUrl ? {source: posterUrl} : null;
  },
  isSpecials({number}) {
    return number === 0;
  },
};

export const Episode: Resolver<import('@prisma/client').Episode> = {
  id: ({id}) => toGid(id, 'Episode'),
  async series({seasonId}, _, {prisma}) {
    const foundSeason = await prisma.season.findFirst({
      where: {id: seasonId},
      select: {series: true},
    });

    return foundSeason?.series;
  },
  season({seasonId}, _, {prisma}) {
    return prisma.season.findFirst({where: {id: seasonId}});
  },
  still({stillUrl}) {
    return stillUrl ? {source: stillUrl} : null;
  },
  async watches({id}, _, {db, watchLoader}) {
    const watches = await db
      .select('id')
      .from(Table.Watches)
      .where({episodeId: id})
      .limit(50);
    return Promise.all(watches.map(({id}) => watchLoader.load(id)));
  },
  async latestWatch({id}, __, {db, watchLoader}) {
    const [lastWatch] = await db
      .select('id')
      .from(Table.Watches)
      .where({episodeId: id})
      .orderBy('createdAt', 'desc')
      .limit(1);

    return lastWatch ? watchLoader.load(lastWatch.id) : null;
  },
};

export const WatchThroughEpisode: Resolver<{
  id: string;
  watchId?: string;
  skipId?: string;
  watchThroughId: string;
  episodeId?: string;
}> = {
  id: ({id}) => toGid(id, 'WatchThroughEpisode'),
  episode({episodeId}, _, {episodeLoader}) {
    return episodeId ? episodeLoader.load(episodeId) : null;
  },
  watchThrough({watchThroughId}, _, {watchThroughLoader}) {
    return watchThroughLoader.load(watchThroughId);
  },
  finished({watchId, skipId}) {
    return watchId != null || skipId != null;
  },
  action({watchId, skipId}, _, {watchLoader, skipLoader}) {
    if (watchId != null)
      return watchLoader.load(watchId).then(addResolvedType('Watch'));

    if (skipId != null)
      return skipLoader.load(skipId).then(addResolvedType('Skip'));

    return null;
  },
};

export const WatchThrough: Resolver<{id: string; seriesId: string}> = {
  id: ({id}) => toGid(id, 'WatchThrough'),
  series({seriesId}, _, {seriesLoader}) {
    return seriesLoader.load(seriesId);
  },
  async watches({id}, _, {db, user, watchLoader}) {
    const watches = await db
      .select('id')
      .from(Table.Watches)
      .where({watchThroughId: id, userId: user.id})
      .limit(50);
    return Promise.all(watches.map(({id}) => watchLoader.load(id)));
  },
  async episodes(
    {id},
    {
      watched,
      finished,
    }: {watched?: 'WATCHED' | 'UNWATCHED'; finished?: boolean},
    {db},
  ) {
    const episodes = await db
      .from(Table.WatchThroughEpisodes)
      .select('*')
      .where((clause) => {
        clause.where({watchThroughId: id});

        if (finished) {
          clause.whereNotNull('watchId').orWhereNotNull('skipId');
        }

        if (watched === 'WATCHED') {
          clause.whereNotNull('watchId');
        } else if (watched === 'UNWATCHED') {
          clause.whereNull('watchId');
        }
      })
      .orderBy('index', 'asc')
      .limit(50);

    return episodes;
  },
  unfinishedEpisodeCount({id: watchThroughId}, _, {db}) {
    return unfinishedEpisodeCount(watchThroughId, {db});
  },
  async nextEpisode({id}, _, {db, episodeLoader}) {
    const [episodeId] = (await db
      .from(Table.WatchThroughEpisodes)
      .pluck('episodeId')
      .where({watchThroughId: id})
      .andWhere((clause) => clause.whereNull('skipId').whereNull('watchId'))
      .orderBy('index', 'asc')
      .limit(50)) as string[];

    return episodeId ? episodeLoader.load(episodeId) : null;
  },
  async lastAction({id}, _, {db, watchLoader, skipLoader}) {
    const [action] = await db
      .from(Table.WatchThroughEpisodes)
      .select(['watchId', 'skipId'])
      .where((clause) => {
        clause.whereNotNull('watchId').orWhereNotNull('skipId');
      })
      .where({watchThroughId: id})
      .orderBy('index', 'desc')
      .limit(1);

    if (action == null) {
      return null;
    }

    const {watchId, skipId} = action;

    if (watchId != null)
      return watchLoader.load(watchId).then(addResolvedType('Watch'));

    if (skipId != null)
      return skipLoader.load(skipId).then(addResolvedType('Skip'));

    return null;
  },
  async lastEpisode({id}, _, {db}) {
    const [lastEpisode] = await db
      .from(Table.WatchThroughEpisodes)
      .select('*')
      .where((clause) => {
        clause.whereNotNull('watchId').orWhereNotNull('skipId');
      })
      .where({watchThroughId: id})
      .orderBy('index', 'desc')
      .limit(1);

    return lastEpisode || null;
  },
};

export const SeriesSubscription: Resolver<{
  id: string;
  seriesId: string;
  createdAt: string;
}> = {
  id: ({id}) => toGid(id, 'SeriesSubscription'),
  subscribedOn: ({createdAt}) => createdAt,
  series({seriesId}, _, {seriesLoader}) {
    return seriesLoader.load(seriesId);
  },
};

export const Watch: Resolver<{
  id: string;
  episodeId?: string;
  watchThroughId?: string;
}> = {
  id: ({id}) => toGid(id, 'Watch'),
  media({episodeId}, _, {episodeLoader}) {
    return episodeId
      ? episodeLoader.load(episodeId).then(addResolvedType('Episode'))
      : null;
  },
  watchThrough({watchThroughId}, _, {watchThroughLoader}) {
    return watchThroughId ? watchThroughLoader.load(watchThroughId) : null;
  },
};

export const Skip: Resolver<{
  id: string;
  episodeId?: string;
  watchThroughId?: string;
}> = {
  id: ({id}) => toGid(id, 'Skip'),
  media({episodeId}, _, {episodeLoader}) {
    return episodeId
      ? episodeLoader.load(episodeId).then(addResolvedType('Episode'))
      : null;
  },
  watchThrough({watchThroughId}, _, {watchThroughLoader}) {
    return watchThroughId ? watchThroughLoader.load(watchThroughId) : null;
  },
};

export const App: Resolver<import('@prisma/client').App> = {
  id: ({id}) => toGid(id, 'App'),
  async extensions({id}, _, {prisma}) {
    const extensions = await prisma.clipsExtension.findMany({
      where: {appId: id},
      take: 50,
      // orderBy: {createAt, 'desc'},
    });

    return extensions.map(addResolvedType('ClipsExtension'));
  },
};

export const AppInstallation: Resolver<
  import('@prisma/client').AppInstallation
> = {
  id: ({id}) => toGid(id, 'AppInstallation'),
  app: ({appId}, _, {prisma}) => prisma.app.findFirst({where: {id: appId}}),
  async extensions({id}, _, {prisma}) {
    const installations = await prisma.clipsExtensionInstallation.findMany({
      where: {appInstallationId: id},
      take: 50,
      // orderBy: {createAt, 'desc'},
    });

    return installations.map(addResolvedType('ClipsExtensionInstallation'));
  },
};

export const ClipsExtension: Resolver<
  import('@prisma/client').ClipsExtension
> = {
  id: ({id}) => toGid(id, 'ClipsExtension'),
  app: ({appId}, _, {prisma}) => prisma.app.findFirst({where: {id: appId}}),
  latestVersion({activeVersionId}, _, {prisma}) {
    return (
      activeVersionId &&
      prisma.clipsExtensionVersion.findFirst({where: {id: activeVersionId}})
    );
  },
  async versions({id}, _, {prisma}) {
    const versions = await prisma.clipsExtensionVersion.findMany({
      where: {extensionId: id},
      take: 50,
      // orderBy: {createAt, 'desc'},
    });

    return versions;
  },
};

export const ClipsExtensionVersion: Resolver<
  import('@prisma/client').ClipsExtensionVersion
> = {
  id: ({id}) => toGid(id, 'ClipsExtensionVersion'),
  extension: ({extensionId}, _, {prisma}) =>
    prisma.clipsExtension.findFirst({where: {id: extensionId}}),
  assets: ({scriptUrl}) => (scriptUrl ? [{source: scriptUrl}] : []),
  translations: ({translations}) =>
    translations && JSON.stringify(translations),
  supports: ({supports}) => supports ?? [],
  configurationSchema: ({configurationSchema}) => configurationSchema ?? [],
};

function resolveClipsExtensionPointCondition(condition: {type: string}) {
  switch (condition.type) {
    case 'series':
      return 'ClipsExtensionPointSeriesCondition';
  }

  throw new Error(`Unknown condition: ${condition}`);
}

export const ClipsExtensionPointCondition: Resolver = {
  __resolveType: resolveClipsExtensionPointCondition,
};

function resolveClipsExtensionString(stringType: {type: string}) {
  switch (stringType.type) {
    case 'static':
      return 'ClipsExtensionConfigurationStringStatic';
    case 'translation':
      return 'ClipsExtensionConfigurationStringTranslation';
  }

  throw new Error(`Unknown stringType: ${stringType}`);
}

export const ClipsExtensionConfigurationString: Resolver = {
  __resolveType: resolveClipsExtensionString,
};

function resolveClipsConfigurationField(configurationField: {type: string}) {
  switch (configurationField.type) {
    case 'string':
      return 'ClipsExtensionStringConfigurationField';
    case 'number':
      return 'ClipsExtensionNumberConfigurationField';
    case 'options':
      return 'ClipsExtensionOptionsConfigurationField';
  }

  throw new Error(`Unknown configuration field: ${configurationField}`);
}

export const ClipsExtensionConfigurationField: Resolver = {
  __resolveType: resolveClipsConfigurationField,
};

export const ClipsExtensionInstallation: Resolver<
  import('@prisma/client').ClipsExtensionInstallation
> = {
  id: ({id}) => toGid(id, 'ClipsExtensionInstallation'),
  extension: ({extensionId}, _, {prisma}) =>
    prisma.clipsExtension.findFirst({where: {id: extensionId}}),
  appInstallation: ({appInstallationId}, _, {prisma}) =>
    prisma.appInstallation.findFirst({where: {id: appInstallationId}}),
  async version({extensionId}, _, {prisma}) {
    const extension = await prisma.clipsExtension.findFirst({
      where: {id: extensionId},
      select: {activeVersion: true},
    });

    return extension?.activeVersion;
  },
  configuration: ({configuration}) =>
    configuration ? JSON.stringify(configuration) : null,
};

function addResolvedType(type: string) {
  return (rest: any) => ({...rest, __resolvedType: type});
}

function resolveType(obj: {__resolvedType?: string; id: string}) {
  return obj.__resolvedType ?? fromGid(obj.id).type;
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

function tmdbStatusToEnum(status: TmdbSeries['status']) {
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

async function tmdbFetch<T = unknown>(path: string): Promise<T> {
  const fetched = await fetch(`https://api.themoviedb.org/3${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
  });

  return fetched.json();
}

interface TmdbSeries {
  name: string;
  status: string;
  seasons: TmdbSeriesSeason[];
  air_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string;
  number_of_seasons?: number;
}

interface TmdbExternalIds {
  imdb_id: string;
}

interface TmdbSeriesSeason {
  season_number: number;
}

interface TmdbSeason {
  season_number: number;
  episodes: TmdbEpisode[];
  air_date?: string;
  overview?: string;
  poster_path?: string;
}

interface TmdbEpisode {
  name: string;
  overview?: string;
  air_date?: string;
  episode_number: number;
  season_number: number;
  still_path?: string;
}

async function updateWatchThrough(
  watchThroughId: string,
  {
    db,
    prisma,
    timestamp = 'now()',
  }: Pick<Context, 'db' | 'prisma'> & {timestamp?: string},
) {
  const finishedUpdate = (await watchThroughIsFinished(watchThroughId, {
    db,
    prisma,
  }))
    ? {status: 'FINISHED', finishedAt: timestamp}
    : {};

  await db
    .from(Table.WatchThroughs)
    .where({id: watchThroughId})
    .update({...finishedUpdate, updatedAt: timestamp});
}

async function watchThroughIsFinished(
  watchThroughId: string,
  {db, prisma}: Pick<Context, 'db' | 'prisma'>,
) {
  const unfinishedEpisodes = await unfinishedEpisodeCount(watchThroughId, {
    db,
  });

  if (unfinishedEpisodes !== 0) return false;

  const [watched] = await db
    .from(Table.WatchThroughEpisodes)
    .pluck<string>('episodeId')
    .where({watchThroughId})
    .andWhere((clause) => clause.whereNotNull('watchId'))
    .orderBy('index', 'desc')
    .limit(1);

  const season = await prisma.season.findFirst({
    where: {episodes: {some: {id: watched}}},
  });

  return season?.status === 'ENDED';
}

async function unfinishedEpisodeCount(
  watchThroughId: string,
  {db}: Pick<Context, 'db'>,
) {
  const [{count}] = await db
    .from(Table.WatchThroughEpisodes)
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
    .count({count: 'WatchThroughEpisodes.id'});

  return parseInt(String(count), 10);
}

async function loadTmdbSeries(
  tmdbId: string,
  {prisma}: Pick<Context, 'prisma'>,
) {
  const [seriesResult, seriesIds] = await Promise.all([
    tmdbFetch<TmdbSeries>(`/tv/${tmdbId}`),
    tmdbFetch<TmdbExternalIds>(`/tv/${tmdbId}/external_ids`),
  ] as const);

  const seasonResults = (
    await Promise.all(
      seriesResult.seasons.map((season) =>
        tmdbFetch<TmdbSeason>(`/tv/${tmdbId}/season/${season.season_number}`),
      ),
    )
  ).filter(({season_number: seasonNumber}) => seasonNumber != null);

  const series = await prisma.series.create({
    data: {
      tmdbId: String(tmdbId),
      imdbId: seriesIds.imdb_id,
      name: seriesResult.name,
      firstAired: tmdbAirDateToDate(seriesResult.first_air_date),
      status: tmdbStatusToEnum(seriesResult.status),
      overview: seriesResult.overview || null,
      posterUrl: seriesResult.poster_path
        ? `https://image.tmdb.org/t/p/original${seriesResult.poster_path}`
        : null,
      seasons: {
        create: seasonResults.map(
          (
            season,
          ): import('@prisma/client').Prisma.SeasonCreateWithoutSeriesInput => ({
            number: season.season_number,
            firstAired: tmdbAirDateToDate(season.air_date),
            overview: season.overview ?? null,
            status:
              season.season_number === seriesResult.number_of_seasons &&
              tmdbStatusToEnum(seriesResult.status) === 'RETURNING'
                ? 'CONTINUING'
                : 'ENDED',
            posterUrl: season.poster_path
              ? `https://image.tmdb.org/t/p/original${season.poster_path}`
              : null,
            episodes: {
              create: season.episodes.map(
                (
                  episode,
                ): import('@prisma/client').Prisma.EpisodeCreateWithoutSeasonInput => ({
                  number: episode.episode_number,
                  title: episode.name,
                  firstAired: tmdbAirDateToDate(episode.air_date),
                  overview: episode.overview || null,
                  stillUrl: episode.still_path
                    ? `https://image.tmdb.org/t/p/original${episode.still_path}`
                    : null,
                }),
              ),
            },
          }),
        ),
      },
    },
  });

  return series;
}

async function createStagedClipsVersion({
  hash,
  appId,
  extensionId,
  extensionName,
  translations,
  supports,
  configurationSchema,
}: {
  hash: string;
  appId: string;
  extensionId: string;
  extensionName: string;
} & CreateClipsInitialVersion) {
  const [
    {S3Client, PutObjectCommand},
    {getSignedUrl},
    {getType},
  ] = await Promise.all([
    import('@aws-sdk/client-s3'),
    import('@aws-sdk/s3-request-presigner'),
    import('mime'),
  ]);

  const s3Client = new S3Client({region: 'us-east-1'});

  const path = `assets/clips/${appId}/${toParam(
    extensionName,
  )}.${extensionId}.${hash}.js`;

  const putCommand = new PutObjectCommand({
    Bucket: 'watch-assets-clips',
    Key: path,
    ContentType: getType(path) ?? 'application/javascript',
    CacheControl: `public, max-age=${60 * 60 * 24 * 365}, immutable`,
    Metadata: {
      'Timing-Allow-Origin': '*',
    },
  });

  const signedScriptUpload = await getSignedUrl(s3Client, putCommand, {
    expiresIn: 3_600,
  });

  const version: Omit<
    import('@prisma/client').Prisma.ClipsExtensionVersionCreateWithoutExtensionInput,
    'status'
  > = {
    scriptUrl: `https://watch.lemon.tools/${path}`,
    apiVersion: 'UNSTABLE',
    translations: translations && JSON.parse(translations),
    supports:
      supports &&
      (supports.map(({extensionPoint, conditions}) => {
        return {
          extensionPoint,
          conditions: conditions?.map((condition) => {
            let resolvedCondition;

            if (condition.seriesId) {
              resolvedCondition = {type: 'series', id: condition.seriesId};
            }

            if (resolvedCondition == null) {
              throw new Error();
            }

            return resolvedCondition;
          }),
        };
      }) as any),
    configurationSchema:
      configurationSchema &&
      (configurationSchema.map(
        ({string: stringField, number: numberField, options: optionsField}) => {
          if (stringField) {
            const {key, label, default: defaultValue} = stringField;

            return {
              type: 'string',
              key,
              default: defaultValue,
              label: normalizeClipsString(label),
            };
          }

          if (numberField) {
            const {key, label, default: defaultValue} = numberField;

            return {
              type: 'number',
              key,
              default: defaultValue,
              label: normalizeClipsString(label),
            };
          }

          if (optionsField) {
            const {key, label, options, default: defaultValue} = optionsField;
            return {
              type: 'options',
              key,
              default: defaultValue,
              label: normalizeClipsString(label),
              options: options.map(({label, value}) => ({
                value,
                label: normalizeClipsString(label),
              })),
            };
          }
        },
      ) as any),
  };

  return {signedScriptUpload, version};
}

function normalizeClipsString({
  static: staticString,
  translation,
}: ClipsExtensionConfigurationStringInput) {
  if (staticString) {
    return {type: 'static', value: staticString};
  }

  if (translation) {
    return {type: 'translation', key: translation};
  }

  throw new Error();
}

function fromGid(gid: string) {
  const {type, id} = /gid:\/\/watch\/(?<type>\w+)\/(?<id>[\w-]+)/.exec(
    gid,
  )!.groups!;
  return {type, id};
}

function toGid(id: string, type: string) {
  return `gid://watch/${type}/${id}`;
}

function toParam(name: string) {
  return name.trim().toLocaleLowerCase().replace(/\s+/g, '-');
}
