import type {IResolvers} from 'graphql-tools';
import fetch from 'node-fetch';

import {createSignedToken, removeAuthCookies} from 'shared/utilities/auth';
import {Table} from 'shared/utilities/database';

import type {
  ClipsExtensionPointSupportInput,
  ClipsExtensionConfigurationSchemaFieldsInput,
  ClipsExtensionConfigurationStringInput,
} from './schema.input';
import {Context} from './context';
import {enqueueSendEmail} from './utilities/email';
import {ClipsExtensionPointConditionInput} from './schema';

type Resolver<Source = never> = IResolvers<Source, Context>;

export const Query: Resolver = {
  me(_, __, {user, userLoader}) {
    return userLoader.load(user.id);
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
        ? await context.db
            .select('*')
            .from(Table.Series)
            .whereIn(
              'tmdbId',
              cappedResults.map(({id}) => String(id)),
            )
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
  series(_, {id}: {id: string}, {seriesLoader}) {
    return seriesLoader.load(fromGid(id).id);
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
  app(_, {id}: {id: string}, {appsLoader}) {
    return appsLoader.load(fromGid(id).id);
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
    {db, clipsExtensionInstallationsLoader, user},
  ) {
    const installations = await db
      .select({
        id: 'ClipsExtensionInstallations.id',
        latestVersionId: 'ClipsExtensions.latestVersionId',
      })
      .from(Table.ClipsExtensionInstallations)
      .join(
        'ClipsExtensions',
        'ClipsExtension.id',
        '=',
        'ClipsExtensionInstallations.extensionId',
      )
      .where({
        'ClipsExtensionInstallations.extensionPoint': extensionPoint,
        'ClipsExtensionInstallations.userId': user.id,
      })
      .limit(50);

    const versions = await db
      .select(['id', 'conditions', 'status'])
      .from(Table.ClipsExtensionVersions)
      .whereIn(
        'id',
        installations
          .map((installation) => installation.latestVersionId)
          .filter(Boolean),
      );

    const filteredInstallations = installations.filter((installation) => {
      const version = versions.find(
        (version) => version.id === installation.latestVersionId,
      );

      if (version == null || version.status !== 'PUBLISHED') {
        return false;
      }

      const versionConditions = JSON.parse(version.conditions);

      return conditions.every((condition) => {
        if (condition.seriesId) {
          return versionConditions.every((versionCondition: any) => {
            return (
              versionCondition.type !== 'series' ||
              versionCondition.id === condition.seriesId
            );
          });
        }

        throw new Error();
      });
    });

    return Promise.all(
      filteredInstallations.map(({id}) =>
        clipsExtensionInstallationsLoader.load(id),
      ),
    );
  },
  clipsInstallation(
    _,
    {id}: {id: string},
    {clipsExtensionInstallationsLoader},
  ) {
    return clipsExtensionInstallationsLoader.load(fromGid(id).id);
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
    {db},
  ) {
    const [user] = await db
      .select('email')
      .from(Table.Users)
      .where({email})
      .limit(1);

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
    {db},
  ) {
    const [user] = await db
      .select('email')
      .from(Table.Users)
      .where({email})
      .limit(1);

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
  async deleteAccount(_, __, {db, user}) {
    await db.delete().from(Table.Users).where({id: user.id});
    return {deletedId: toGid(user.id, 'User')};
  },
  async disconnectGithubAccount(_, __, {db, user}) {
    const [githubAccount] = await db
      .delete()
      .from(Table.GithubAccounts)
      .where({userId: user.id})
      .limit(1)
      .returning('*');

    return {githubAccount};
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
    {db, user, watchLoader, episodeLoader, watchThroughLoader},
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
    {db, user, skipLoader, episodeLoader, watchThroughLoader},
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
    {id: gid, status}: {id: string; status: string},
    {db, seasonLoader},
  ) {
    const {id} = fromGid(gid);
    await db.from(Table.Seasons).where({id}).update({status});

    if (status === 'ENDED') {
      const watchThroughsToCheck = await db
        .select({id: 'WatchThroughs.id', updatedAt: 'WatchThroughs.updatedAt'})
        .from(Table.Seasons)
        .join(
          'WatchThroughs',
          'WatchThroughs.seriesId',
          '=',
          'Seasons.seriesId',
        )
        .where({'Seasons.id': id, 'WatchThroughs.status': 'ONGOING'});

      await Promise.all(
        watchThroughsToCheck.map(({id, updatedAt}) =>
          updateWatchThrough(id, {db, timestamp: updatedAt}),
        ),
      );
    }

    return {season: await seasonLoader.load(id)};
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
  async createApp(_, {name}: {name: string}, {db}) {
    const [app] = await db.insert({name}, '*').into(Table.Apps);

    return {app};
  },
  async deleteApp(_, {id}: {id: string}, {db}) {
    await db
      .from(Table.Apps)
      .where({id: fromGid(id).id})
      .delete();
    return {deletedId: id};
  },
  async updateApp(_, {id, name}: {id: string; name?: string}, {db}) {
    const [app] = await db
      .update(name == null ? {} : {name}, '*')
      .where({id: fromGid(id).id})
      .into(Table.Apps);

    return {app};
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
      initialVersion?: {
        hash: string;
        translations?: string;
        supports?: ClipsExtensionPointSupportInput[];
        configurationSchema?: ClipsExtensionConfigurationSchemaFieldsInput[];
      };
    },
    {db, appsLoader},
  ) {
    const [extension] = await db
      .insert({name, appId: fromGid(appId).id}, '*')
      .into(Table.ClipsExtensions);

    let additionalResults = {};

    if (initialVersion) {
      additionalResults = await createSignedClipsVersionUpload({
        db,
        appId: fromGid(appId).id,
        extensionId: extension.id,
        extensionName: name,
        ...initialVersion,
      });
    }

    return {
      extension,
      app: await appsLoader.load(fromGid(appId).id),
      ...additionalResults,
    };
  },
  async deleteClipsExtension(_, {id}: {id: string}, {db, appsLoader}) {
    const [{appId}] = await db
      .select('appId')
      .from(Table.ClipsExtensions)
      .where({id: fromGid(id).id})
      .limit(1);

    await db
      .from(Table.ClipsExtensions)
      .where({id: fromGid(id).id})
      .delete();

    return {deletedId: id, app: await appsLoader.load(appId)};
  },
  async updateClipsExtension(_, {id, name}: {id: string; name?: string}, {db}) {
    const [extension] = await db
      .update(name == null ? {} : {name}, '*')
      .where({id: fromGid(id).id})
      .into(Table.ClipsExtensions);

    return {extension};
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
    {db, clipsExtensionsLoader},
  ) {
    const [existingVersion] = await db
      .select('*')
      .from(Table.ClipsExtensionVersions)
      .where({
        status: 'BUILDING',
        extensionId: fromGid(extensionId).id,
      })
      .limit(1);

    const [details] = await db
      .select({appId: 'Apps.id', extensionName: 'ClipsExtensions.name'})
      .from(Table.Apps)
      .join(Table.ClipsExtensions, 'ClipsExtensions.appId', '=', 'Apps.id')
      .where({'ClipsExtensions.id': fromGid(extensionId).id})
      .limit(1);

    const {version, signedScriptUpload} = await createSignedClipsVersionUpload({
      db,
      hash,
      versionId: existingVersion?.id,
      appId: details.appId,
      extensionId: fromGid(extensionId).id,
      extensionName: name ?? details.extensionName,
      translations,
      supports,
      configurationSchema,
    });

    return {
      version,
      signedScriptUpload,
      extension: await clipsExtensionsLoader.load(fromGid(extensionId).id),
    };
  },
  async publishLatestClipsExtensionVersion(
    _,
    {extensionId}: {extensionId: string},
    {db, clipsExtensionsLoader},
  ) {
    const [version] = await db
      .select({id: 'ClipsExtensionVersions.id'})
      .from(Table.ClipsExtensions)
      .join(
        Table.ClipsExtensionVersions,
        'ClipsExtensionVersions.extensionId',
        '=',
        'ClipsExtensions.id',
      )
      .where({
        'ClipsExtensions.id': fromGid(extensionId).id,
        'ClipsExtensionVersions.status': 'BUILDING',
      })
      .limit(1);

    if (version == null) {
      return {};
    }

    await db.transaction(async (trx) => {
      await Promise.all([
        trx
          .update({status: 'PUBLISHED'}, '*')
          .into(Table.ClipsExtensionVersions)
          .where({id: version.id}),

        trx
          .update({latestVersionId: version.id})
          .into(Table.ClipsExtensions)
          .where({id: fromGid(extensionId).id}),
      ]);
    });

    return {
      version,
      extension: await clipsExtensionsLoader.load(fromGid(extensionId).id),
    };
  },
  async installApp(_, {id}: {id: string}, {db, user, appsLoader}) {
    const [installation] = await db
      .insert({appId: fromGid(id).id, userId: user.id}, '*')
      .into(Table.AppInstallations);

    return {app: await appsLoader.load(fromGid(id).id), installation};
  },
  async installClipsExtension(
    _,
    {
      id,
      extensionPoint,
      configuration,
    }: {id: string; extensionPoint: string; configuration?: string},
    {db, user, clipsExtensionsLoader},
  ) {
    const [appInstallation] = await db
      .select({id: 'AppInstallations.id'})
      .from(Table.ClipsExtensions)
      .join(
        Table.AppInstallations,
        'AppInstallations.appId',
        '=',
        'ClipsExtensions.appId',
      )
      .where({'ClipsExtensions.id': fromGid(id).id})
      .limit(1);

    if (appInstallation == null) {
      throw new Error(`You must install the app for extension ${id} first`);
    }

    const [installation] = await db
      .insert(
        {
          extensionId: fromGid(id).id,
          appInstallId: appInstallation.id,
          extensionPoint,
          configuration,
          userId: user.id,
        },
        '*',
      )
      .into(Table.ClipsExtensionInstallations);

    return {
      extension: await clipsExtensionsLoader.load(fromGid(id).id),
      installation,
    };
  },
  async updateClipsExtensionInstallation(
    _,
    {id, configuration}: {id: string; configuration?: string},
    {db, user, clipsExtensionsLoader},
  ) {
    const [installation] = await db
      .update(
        {
          configuration,
        },
        '*',
      )
      .from(Table.ClipsExtensionInstallations)
      .where({id: fromGid(id).id, userId: user.id});

    return {
      extension: await clipsExtensionsLoader.load(fromGid(id).id),
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

export const User: Resolver = {
  id: ({id}) => toGid(id, 'User'),
  githubAccount: async ({id}, _, {db}) => {
    const [result] = await db
      .select('*')
      .from(Table.GithubAccounts)
      .where({userId: id})
      .limit(1);

    return result;
  },
};

export const GithubAccount: Resolver = {
  avatarImage: ({avatarUrl}: {avatarUrl?: string}) => {
    return {source: avatarUrl};
  },
};

export const Series: Resolver<{
  id: string;
  poster?: string;
}> = {
  id: ({id}) => toGid(id, 'Series'),
  async season({id}, {number}: {number: number}, {db}) {
    const seasonResults = await db
      .select('*')
      .from(Table.Seasons)
      .where({seriesId: id, number})
      .limit(1);
    return seasonResults[0] || null;
  },
  async seasons({id}, _, {db, seasonLoader}) {
    const seasons = await db
      .select('id')
      .from(Table.Seasons)
      .where({seriesId: id});
    return Promise.all(seasons.map(({id}) => seasonLoader.load(id)));
  },
  async episode(
    {id},
    {number, seasonNumber}: {number: number; seasonNumber: string},
    {db},
  ) {
    const [seasonResult] = await db
      .select('id')
      .from(Table.Seasons)
      .where({seriesId: id, number: seasonNumber})
      .limit(1);
    const episodeResult = seasonResult
      ? await db
          .select('*')
          .from(Table.Episodes)
          .where({seriesId: id, seasonId: seasonResult.id, number})
          .limit(1)
      : null;
    return episodeResult && episodeResult[0];
  },
  async episodes({id}, _, {db, episodeLoader}) {
    const seasons = await db
      .select('id')
      .from(Table.Episodes)
      .where({seriesId: id});
    return Promise.all(seasons.map(({id}) => episodeLoader.load(id)));
  },
  poster({poster}) {
    return poster ? {source: poster} : null;
  },
};

export const Season: Resolver = {
  id: ({id}) => toGid(id, 'Season'),
  series({seriesId}, _, {seriesLoader}) {
    return seriesLoader.load(seriesId);
  },
  async episodes({id, seriesId}, _, {db, episodeLoader}) {
    const episodes = await db
      .select('id')
      .from(Table.Episodes)
      .where({seriesId, seasonId: id});
    return Promise.all(episodes.map(({id}) => episodeLoader.load(id)));
  },
  poster({poster}) {
    return poster ? {source: poster} : null;
  },
  isSpecials({number}) {
    return number === 0;
  },
};

export const Episode: Resolver = {
  id: ({id}) => toGid(id, 'Episode'),
  series({seriesId}, _, {seriesLoader}) {
    return seriesLoader.load(seriesId);
  },
  season({seasonId}, _, {seasonLoader}) {
    return seasonLoader.load(seasonId);
  },
  still({still}) {
    return still ? {source: still} : null;
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

export const App: Resolver<{id: string}> = {
  id: ({id}) => toGid(id, 'App'),
  async extensions({id}, _, {db, clipsExtensionsLoader}) {
    const versions = await db
      .from(Table.ClipsExtensions)
      .select('id')
      .where({appId: id})
      .orderBy('createdAt', 'desc')
      .limit(50);

    return Promise.all(
      versions.map(({id}) =>
        clipsExtensionsLoader.load(id).then(addResolvedType('ClipsExtension')),
      ),
    );
  },
};

export const AppInstallation: Resolver<{
  id: string;
  appId: string;
}> = {
  id: ({id}) => toGid(id, 'AppInstallation'),
  app: ({appId}, _, {appsLoader}) => appsLoader.load(fromGid(appId).id),
  async extensions({id}, _, {db, clipsExtensionInstallationsLoader}) {
    const versions = await db
      .from(Table.ClipsExtensionInstallations)
      .select('id')
      .where({appInstallId: id})
      .orderBy('createdAt', 'desc')
      .limit(50);

    return Promise.all(
      versions.map(({id}) =>
        clipsExtensionInstallationsLoader
          .load(id)
          .then(addResolvedType('ClipsExtensionInstallation')),
      ),
    );
  },
};

export const ClipsExtension: Resolver<{
  id: string;
  appId: string;
  latestVersionId?: string;
}> = {
  id: ({id}) => toGid(id, 'ClipsExtension'),
  app: ({appId}, _, {appsLoader}) => appsLoader.load(appId),
  latestVersion({latestVersionId}, _, {clipsExtensionVersionsLoader}) {
    return latestVersionId
      ? clipsExtensionVersionsLoader.load(latestVersionId)
      : null;
  },
  async versions({id}, _, {db, clipsExtensionVersionsLoader}) {
    const versions = await db
      .from(Table.ClipsExtensionVersions)
      .select('id')
      .where({extensionId: id})
      .orderBy('createdAt', 'desc')
      .limit(50);

    return Promise.all(
      versions.map(({id}) => clipsExtensionVersionsLoader.load(id)),
    );
  },
};

export const ClipsExtensionVersion: Resolver<{
  id: string;
  extensionId: string;
  scriptUrl?: string;
  supports?: string;
  configurationSchema?: string;
  translations?: string;
}> = {
  id: ({id}) => toGid(id, 'ClipsExtensionVersion'),
  extension: ({extensionId}, _, {clipsExtensionsLoader}) =>
    clipsExtensionsLoader.load(extensionId),
  assets: ({scriptUrl}) => (scriptUrl ? [{source: scriptUrl}] : []),
  supports: ({supports}) => {
    return supports ? JSON.parse(supports) : [];
  },
  configurationSchema: ({configurationSchema}) => {
    return configurationSchema ? JSON.parse(configurationSchema) : [];
  },
};

function resolveClipsExtensionPointCondition(condition: {type: string}) {
  switch (condition.type) {
    case 'series':
      return 'ClipsExtensionPointSeriesCondition';
  }

  throw new Error(`Unknown condition: ${condition}`);
}

export const ClipsExtensionPointSeriesCondition: Resolver = {
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

export const ClipsExtensionConfigurationStringTranslation: Resolver = {
  __resolveType: resolveClipsExtensionString,
};

export const ClipsExtensionConfigurationStringStatic: Resolver = {
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

export const ClipsExtensionStringConfigurationField: Resolver = {
  __resolveType: resolveClipsConfigurationField,
};

export const ClipsExtensionNumberConfigurationField: Resolver = {
  __resolveType: resolveClipsConfigurationField,
};

export const ClipsExtensionOptionsConfigurationField: Resolver = {
  __resolveType: resolveClipsConfigurationField,
};

export const ClipsExtensionInstallation: Resolver<{
  id: string;
  extensionId: string;
  appInstallId: string;
}> = {
  id: ({id}) => toGid(id, 'ClipsExtensionInstallation'),
  extension: ({extensionId}, _, {clipsExtensionsLoader}) =>
    clipsExtensionsLoader.load(extensionId),
  appInstallation: ({appInstallId}, _, {appInstallationsLoader}) =>
    appInstallationsLoader.load(appInstallId),
  async version(
    {extensionId},
    _,
    {clipsExtensionsLoader, clipsExtensionVersionsLoader},
  ) {
    const extension = (await clipsExtensionsLoader.load(extensionId)) as any;
    return extension?.latestVersionId
      ? clipsExtensionVersionsLoader.load(extension.latestVersionId)
      : null;
  },
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
  {db, timestamp = 'now()'}: Pick<Context, 'db'> & {timestamp?: string},
) {
  const finishedUpdate = (await watchThroughIsFinished(watchThroughId, {db}))
    ? {status: 'FINISHED', finishedAt: timestamp}
    : {};

  await db
    .from(Table.WatchThroughs)
    .where({id: watchThroughId})
    .update({...finishedUpdate, updatedAt: timestamp});
}

async function watchThroughIsFinished(
  watchThroughId: string,
  {db}: Pick<Context, 'db'>,
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

  const [season] = await db
    .from(Table.Episodes)
    .select({id: 'Seasons.id', status: 'Seasons.status'})
    .join('Seasons', 'Seasons.id', '=', 'Episodes.seasonId')
    .whereIn('Episodes.id', [watched]);

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

async function loadTmdbSeries(tmdbId: string, {db}: Pick<Context, 'db'>) {
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

  return db.transaction(async (trx) => {
    const [series] = await trx
      .insert(
        {
          tmdbId,
          imdbId: seriesIds.imdb_id,
          name: seriesResult.name,
          firstAired: tmdbAirDateToDate(seriesResult.first_air_date),
          status: tmdbStatusToEnum(seriesResult.status),
          overview: seriesResult.overview || null,
          poster: seriesResult.poster_path
            ? `https://image.tmdb.org/t/p/original${seriesResult.poster_path}`
            : null,
        },
        '*',
      )
      .into(Table.Series);

    const {id: seriesId} = series;

    const seasonsToInsert = seasonResults.map((season) => ({
      seriesId,
      number: season.season_number,
      firstAired: tmdbAirDateToDate(season.air_date),
      overview: season.overview ?? null,
      status:
        season.season_number === seriesResult.number_of_seasons &&
        tmdbStatusToEnum(seriesResult.status) === 'RETURNING'
          ? 'CONTINUING'
          : 'ENDED',
      poster: season.poster_path
        ? `https://image.tmdb.org/t/p/original${season.poster_path}`
        : null,
    }));

    const seasonIds: {id: string; number: number}[] =
      seasonsToInsert.length > 0
        ? await trx
            .insert(seasonsToInsert, ['id', 'number'])
            .into(Table.Seasons)
        : [];

    const seasonToId = new Map(seasonIds.map(({id, number}) => [number, id]));

    const episodesToInsert = seasonResults.reduce<any[]>((episodes, season) => {
      return [
        ...episodes,
        ...season.episodes.map((episode) => ({
          seriesId,
          seasonId: seasonToId.get(episode.season_number),
          number: episode.episode_number,
          title: episode.name,
          firstAired: tmdbAirDateToDate(episode.air_date),
          overview: episode.overview || null,
          still: episode.still_path
            ? `https://image.tmdb.org/t/p/original${episode.still_path}`
            : null,
        })),
      ];
    }, []);

    if (episodesToInsert.length > 0) {
      await trx.insert(episodesToInsert, ['id']).into(Table.Episodes);
    }

    return series;
  });
}

async function createSignedClipsVersionUpload({
  hash,
  appId,
  extensionId,
  extensionName,
  versionId,
  db,
  translations,
  supports,
  configurationSchema,
}: {
  hash: string;
  appId: string;
  extensionId: string;
  extensionName: string;
  versionId?: string;
  db: Context['db'];
  translations?: string;
  supports?: ClipsExtensionPointSupportInput[];
  configurationSchema?: ClipsExtensionConfigurationSchemaFieldsInput[];
}) {
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

  const upsert = {
    scriptUrl: `https://watch.lemon.tools/${path}`,
    translations,
    supports:
      supports &&
      JSON.stringify(
        supports.map(({extensionPoint, conditions}) => {
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
        }),
      ),
    configurationSchema:
      configurationSchema &&
      JSON.stringify(
        configurationSchema.map(
          ({
            string: stringField,
            number: numberField,
            options: optionsField,
          }) => {
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
        ),
      ),
  };

  const [version] = versionId
    ? await db
        .update(upsert, '*')
        .into(Table.ClipsExtensionVersions)
        .where({id: versionId})
    : await db
        .insert(
          {
            extensionId,
            status: 'BUILDING',
            ...upsert,
          },
          '*',
        )
        .into(Table.ClipsExtensionVersions);

  return {version, signedScriptUpload};
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
