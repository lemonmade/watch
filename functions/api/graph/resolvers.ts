import type {IResolvers} from 'graphql-tools';
import fetch from 'node-fetch';

import {createSignedToken, removeAuthCookies} from 'shared/utilities/auth';

import type {
  CreateClipsInitialVersion,
  ClipsExtensionPointSupportInput,
  ClipsExtensionConfigurationSchemaFieldsInput,
  ClipsExtensionConfigurationStringInput,
} from './schema-input-types';
import {Context} from './context';
import {enqueueSendEmail} from './utilities/email';
import {ClipsExtensionPointConditionInput} from './schema';

const PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH = 12;
const PERSONAL_ACCESS_TOKEN_PREFIX = 'wlp_';

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
  watch(_, {id}: {id: string}, {prisma, user}) {
    return prisma.watch.findFirst({
      where: {id: fromGid(id).id, userId: user.id},
    });
  },
  series(_, {id}: {id: string}, {prisma}) {
    return prisma.series.findFirst({where: {id: fromGid(id).id}});
  },
  subscription(_, {id}: {id: string}, {prisma, user}) {
    return prisma.seriesSubscription.findFirst({
      where: {id: fromGid(id).id, userId: user.id},
    });
  },
  subscriptions(_, __, {user, prisma}) {
    return prisma.seriesSubscription.findMany({
      where: {userId: user.id},
      orderBy: {createdAt: 'desc'},
      take: 50,
    });
  },
  watchThrough(_, {id}: {id: string}, {prisma, user}) {
    return prisma.watchThrough.findFirst({
      where: {id: fromGid(id).id, userId: user.id},
    });
  },
  watchThroughs(
    _,
    {
      status = 'ONGOING',
    }: {status?: import('@prisma/client').WatchThroughStatus},
    {prisma, user},
  ) {
    return prisma.watchThrough.findMany({
      where: {status, userId: user.id},
      take: 50,
    });
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
  season: number;
  episode?: number;
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
    {prisma, user},
  ) {
    const episodeId = fromGid(episodeGid).id;
    const watchThroughId = watchThroughGid && fromGid(watchThroughGid).id;

    const validatedWatchThroughId = watchThroughId
      ? (
          await prisma.watchThrough.findFirst({
            where: {id: watchThroughId, userId: user.id},
            rejectOnNotFound: true,
          })
        ).id
      : undefined;

    const {episode, ...watch} = await prisma.watch.create({
      data: {
        episodeId,
        watchThroughId: validatedWatchThroughId,
        rating,
        notes,
        startedAt,
        finishedAt,
        userId: user.id,
      },
      include: {
        episode: true,
      },
    });

    let watchThrough: import('@prisma/client').WatchThrough | undefined;

    if (validatedWatchThroughId) {
      watchThrough = await updateWatchThrough(validatedWatchThroughId, {
        prisma,
        watch,
        episode,
      });
    }

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
    {prisma, user},
  ) {
    const episodeId = fromGid(episodeGid).id;
    const watchThroughId = watchThroughGid && fromGid(watchThroughGid).id;

    const validatedWatchThroughId = watchThroughId
      ? (
          await prisma.watchThrough.findFirst({
            where: {id: watchThroughId, userId: user.id},
            rejectOnNotFound: true,
          })
        ).id
      : undefined;

    const {episode, ...skip} = await prisma.skip.create({
      data: {
        episodeId,
        watchThroughId: validatedWatchThroughId,
        notes,
        at,
        userId: user.id,
      },
      include: {
        episode: true,
      },
    });

    let watchThrough: import('@prisma/client').WatchThrough | undefined;

    if (validatedWatchThroughId) {
      watchThrough = await updateWatchThrough(validatedWatchThroughId, {
        prisma,
        skip,
        episode,
      });
    }

    return {skip, episode, watchThrough};
  },
  async stopWatchThrough(_, {id: gid}: {id: string}, {prisma, user}) {
    const {id} = fromGid(gid);

    const validatedWatchThrough = await prisma.watchThrough.findFirst({
      where: {id, userId: user.id},
      select: {id: true},
      rejectOnNotFound: true,
    });

    const watchThrough = await prisma.watchThrough.update({
      data: {status: 'STOPPED', updatedAt: new Date()},
      where: {id: validatedWatchThrough.id},
    });

    return {watchThrough};
  },
  async startWatchThrough(
    _,
    {
      series: seriesGid,
      from,
      to,
      includeSpecials = false,
    }: {
      series: string;
      from?: Slice;
      to?: Slice;
      includeSpecials?: boolean;
    },
    {user, prisma},
  ) {
    const {id: seriesId} = fromGid(seriesGid);

    const series = await prisma.series.findFirst({
      where: {id: seriesId},
      include: {seasons: {select: {number: true}}},
      rejectOnNotFound: true,
    });

    const normalizedFrom: Slice =
      from ??
      (includeSpecials && series.seasons.some((season) => season.number === 0)
        ? {season: 0, episode: 1}
        : {season: 1, episode: 1});

    const normalizedTo: Slice = to ?? {
      season: Math.max(...series.seasons.map((season) => season.number)),
    };

    const watchThrough = await prisma.watchThrough.create({
      data: {
        seriesId,
        userId: user.id,
        from: bufferFromSlice(normalizedFrom),
        to: bufferFromSlice(normalizedTo),
        current: bufferFromSlice({episode: 1, ...normalizedFrom}),
      },
    });

    return {watchThrough};
  },
  async subscribeToSeries(_, {id}: {id: string}, {user, prisma}) {
    const subscription = await prisma.seriesSubscription.create({
      data: {seriesId: fromGid(id).id, userId: user.id},
    });

    return {subscription};
  },
  async deleteWatch(_, {id: gid}: {id: string}, {user, prisma}) {
    const {id} = fromGid(gid);

    const validatedWatch = await prisma.watch.findFirst({
      where: {id, userId: user.id},
      select: {id: true},
      rejectOnNotFound: true,
    });

    // We should be making sure we don’t need to reset the `current`
    // field...
    const {watchThrough} = await prisma.watch.delete({
      where: {id: validatedWatch.id},
      include: {watchThrough: true},
    });

    return {
      deletedWatchId: toGid(validatedWatch.id, 'Watch'),
      watchThrough,
    };
  },
  async deleteWatchThrough(_, {id: gid}: {id: string}, {prisma, user}) {
    const {id} = fromGid(gid);

    const validatedWatchThrough = await prisma.watchThrough.findFirst({
      where: {id, userId: user.id},
      select: {id: true},
      rejectOnNotFound: true,
    });

    await prisma.watchThrough.delete({
      where: {id: validatedWatchThrough.id},
    });

    return {
      deletedWatchThroughId: toGid(validatedWatchThrough.id, 'WatchThrough'),
    };
  },
  // Should be gated on permissions, and should update watchthroughs async
  async updateSeason(
    _,
    {
      id: gid,
      status,
    }: {id: string; status: import('@prisma/client').SeasonStatus},
    {prisma},
  ) {
    const {id} = fromGid(gid);
    const season = await prisma.season.update({where: {id}, data: {status}});

    if (status === 'ENDED') {
      await prisma.watchThrough.updateMany({
        where: {
          to: bufferFromSlice({season: season.number}),
          current: bufferFromSlice({
            season: season.number,
            episode: season.episodeCount + 1,
          }),
          seriesId: season.seriesId,
          status: 'ONGOING',
        },
        data: {
          status: 'FINISHED',
          current: null,
        },
      });
    }

    return {season};
  },
  async watchEpisodesFromSeries(
    _,
    {
      series: seriesGid,
      slice,
    }: {series: string; slice?: {from?: Slice; to?: Slice}},
    {user, prisma},
  ) {
    const {id} = fromGid(seriesGid);

    const {from, to} = slice ?? {};

    const series = await prisma.series.findFirst({
      where: {id},
      select: {
        seasons: {
          where:
            from || to
              ? {
                  number: {gte: from?.season, lte: to?.season},
                }
              : undefined,
          select: {
            number: true,
            episodes: {select: {id: true, number: true}},
          },
        },
      },
      rejectOnNotFound: true,
    });

    await prisma.watch.createMany({
      data: series.seasons.reduce<
        import('@prisma/client').Prisma.WatchCreateManyInput[]
      >((watches, season) => {
        let matchingEpisodes = season.episodes;

        if (from?.episode && from.season === season.number) {
          matchingEpisodes = matchingEpisodes.filter(
            (episode) => episode.number >= from.episode!,
          );
        }

        if (to?.episode && to.season === season.number) {
          matchingEpisodes = matchingEpisodes.filter(
            (episode) => episode.number <= to.episode!,
          );
        }

        return [
          ...watches,
          ...matchingEpisodes.map(
            (
              episode,
            ): import('@prisma/client').Prisma.WatchCreateManyInput => ({
              userId: user.id,
              episodeId: episode.id,
            }),
          ),
        ];
      }, []),
    });

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
  async createPersonalAccessToken(_, __, {user, prisma}) {
    const {randomBytes} = await import('crypto');

    const token = `${PERSONAL_ACCESS_TOKEN_PREFIX}${randomBytes(
      PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH,
    )
      .toString('hex')
      .slice(0, PERSONAL_ACCESS_TOKEN_RANDOM_LENGTH)}`;

    const personalAccessToken = await prisma.personalAccessToken.create({
      data: {
        token,
        userId: user.id,
      },
    });

    return {personalAccessToken, plaintextToken: token};
  },
  async deletePersonalAccessToken(_, {id}: {id: string}, {user, prisma}) {
    const token = await prisma.personalAccessToken.findFirst({
      where: {id: fromGid(id).id, userId: user.id},
    });

    if (token) {
      await prisma.personalAccessToken.delete({where: {id: token.id}});
    }

    return {deletedPersonalAccessTokenId: token?.id};
  },
};

export const Watchable: Resolver = {
  __resolveType: resolveType,
};

export const Reviewable: Resolver = {
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
  accessTokens({id}, _, {user, prisma}) {
    if (user.id !== id) {
      throw new Error();
    }

    return prisma.personalAccessToken.findMany({
      where: {userId: user.id},
      take: 50,
    });
  },
};

export const GithubAccount: Resolver<import('@prisma/client').GithubAccount> = {
  avatarImage: ({avatarUrl}: {avatarUrl?: string}) => {
    return {source: avatarUrl};
  },
};

export const PersonalAccessToken: Resolver<
  import('@prisma/client').PersonalAccessToken
> = {
  id: ({id}) => toGid(id, 'PersonalAccessToken'),
  length: ({token}) => token.length,
  lastFourCharacters: ({token}) => token.slice(-4),
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
  watches({id}, _, {prisma, user}) {
    return prisma.watch.findMany({
      where: {episodeId: id, userId: user.id},
      take: 50,
    });
  },
  latestWatch({id}, __, {prisma, user}) {
    return prisma.watch.findFirst({
      where: {episodeId: id, userId: user.id},
      orderBy: {finishedAt: 'desc', startedAt: 'desc', createdAt: 'desc'},
    });
  },
};

export const WatchThrough: Resolver<import('@prisma/client').WatchThrough> = {
  id: ({id}) => toGid(id, 'WatchThrough'),
  series({seriesId}, _, {prisma}) {
    return prisma.series.findFirst({where: {id: seriesId}});
  },
  watches({id}, _, {user, prisma}) {
    return prisma.watch.findMany({
      where: {watchThroughId: id, userId: user.id},
      take: 50,
    });
  },
  async unfinishedEpisodeCount(
    {seriesId, current: currentBuffer, to: toBuffer},
    _,
    {prisma},
  ) {
    if (currentBuffer == null) return 0;

    const to = sliceFromBuffer(toBuffer);
    const current = sliceFromBuffer(currentBuffer);

    // This logic is a bit incorrect right now, because there can be
    // episodes that are in the future. For now, the client can query
    // `nextEpisode` to check for that case
    const {seasons} = await prisma.series.findFirst({
      where: {id: seriesId},
      select: {
        seasons: {
          where: {number: {gte: current.season, lte: to.season}},
          select: {number: true, episodeCount: true},
        },
      },
      rejectOnNotFound: true,
    });

    return seasons.reduce((count, season) => {
      if (current.season > season.number || to.season < season.number) {
        return count;
      }

      return current.season === season.number
        ? season.episodeCount - current.episode! + 1
        : season.episodeCount;
    }, 0);
  },
  nextEpisode({current, seriesId}, _, {prisma}) {
    if (current == null) return null;

    const slice = sliceFromBuffer(current);

    return prisma.episode.findFirst({
      where: {number: slice.episode, season: {number: slice.season, seriesId}},
    });
  },
};

export const SeriesSubscription: Resolver<
  import('@prisma/client').SeriesSubscription
> = {
  id: ({id}) => toGid(id, 'SeriesSubscription'),
  subscribedOn: ({createdAt}) => createdAt,
  series({seriesId}, _, {prisma}) {
    return prisma.series.findFirst({where: {id: seriesId}});
  },
};

export const Watch: Resolver<import('@prisma/client').Watch> = {
  id: ({id}) => toGid(id, 'Watch'),
  async media({episodeId}, _, {prisma}) {
    const episode = await prisma.episode.findFirst({
      where: {id: episodeId},
      rejectOnNotFound: true,
    });

    return addResolvedType('Episode')(episode);
  },
  watchThrough({watchThroughId}, _, {prisma, user}) {
    return watchThroughId
      ? prisma.watchThrough.findFirst({
          where: {id: watchThroughId, userId: user.id},
          rejectOnNotFound: true,
        })
      : null;
  },
};

export const Skip: Resolver<import('@prisma/client').Skip> = {
  id: ({id}) => toGid(id, 'Skip'),
  async media({episodeId}, _, {prisma}) {
    const episode = await prisma.episode.findFirst({
      where: {id: episodeId},
      rejectOnNotFound: true,
    });

    return addResolvedType('Episode')(episode);
  },
  watchThrough({watchThroughId}, _, {prisma, user}) {
    return watchThroughId
      ? prisma.watchThrough.findFirst({
          where: {id: watchThroughId, userId: user.id},
          rejectOnNotFound: true,
        })
      : null;
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

// Assumes you already validated ownership of the watchthrough!
async function updateWatchThrough(
  id: string,
  {
    prisma,
    episode,
    ...action
  }: Pick<Context, 'prisma'> & {
    episode: import('@prisma/client').Episode;
  } & (
      | {watch: import('@prisma/client').Watch}
      | {skip: import('@prisma/client').Skip}
    ),
) {
  const watchThrough = await prisma.watchThrough.findFirst({
    where: {id},
    rejectOnNotFound: true,
  });

  const episodeNumber = episode.number;

  const season = await prisma.season.findFirst({
    where: {id: episode.seasonId},
    select: {status: true, number: true, episodeCount: true},
    rejectOnNotFound: true,
  });

  const to = sliceFromBuffer(watchThrough.to);

  const nextEpisodeInSeasonNumber =
    episodeNumber === season.episodeCount ? undefined : episodeNumber + 1;

  const updatedAt =
    'watch' in action
      ? action.watch.finishedAt ??
        action.watch.startedAt ??
        action.watch.createdAt
      : action.skip.at ?? action.skip.createdAt;

  if (
    to.season === season.number &&
    (to.episode === episodeNumber ||
      (to.episode == null &&
        nextEpisodeInSeasonNumber == null &&
        season.status === 'ENDED'))
  ) {
    return prisma.watchThrough.update({
      where: {id},
      data: {
        status: 'FINISHED',
        current: null,
        updatedAt,
        finishedAt: updatedAt,
      },
    });
  }

  return prisma.watchThrough.update({
    where: {id},
    data: {
      current: Buffer.from([
        nextEpisodeInSeasonNumber == null ? season.number + 1 : season.number,
        nextEpisodeInSeasonNumber ?? 1,
      ]),
      updatedAt,
    },
  });
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
      seasonCount: seasonResults.length,
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
            episodeCount: season.episodes.length,
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

function bufferFromSlice(slice: Slice) {
  return slice.episode == null
    ? Buffer.from([slice.season])
    : Buffer.from([slice.season, slice.episode]);
}

function sliceFromBuffer(buffer: Buffer): Slice {
  const sliceArray = new Uint8Array(buffer);
  return sliceArray.length === 1
    ? {season: sliceArray[0]}
    : {season: sliceArray[0], episode: sliceArray[1]};
}
