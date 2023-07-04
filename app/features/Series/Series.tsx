import {type ComponentProps} from 'react';
import {useNavigate, usePerformanceNavigation, useSignal} from '@quilted/quilt';
import {
  Action,
  ActionList,
  BlockStack,
  InlineStack,
  Text,
  TextAction,
  Section,
  Header,
  Heading,
  HeadingAction,
  Icon,
  InlineGrid,
  Menu,
  Popover,
  Style,
  Tag,
  Modal,
  TextBlock,
  Poster,
  Disclosure,
  EpisodeImage,
} from '@lemon/zest';

import {SpoilerAvoidance} from '~/shared/spoilers.ts';

import {useQuery, useMutation} from '~/shared/graphql.ts';
import {useClips, Clip} from '~/shared/clips.ts';

import seriesQuery, {type SeriesQueryData} from './graphql/SeriesQuery.graphql';
import seasonEpisodesQuery, {
  type SeasonEpisodesQueryData,
} from './graphql/SeasonEpisodesQuery.graphql';
import startWatchThroughMutation from './graphql/StartWatchThroughMutation.graphql';
import subscribeToSeriesMutation from './graphql/SubscribeToSeriesMutation.graphql';
import markSeasonAsFinishedMutation from './graphql/MarkSeasonAsFinishedMutation.graphql';
import deleteSeriesMutation from './graphql/DeleteSeriesMutation.graphql';
import synchronizeSeriesWithTmdbMutation from './graphql/SynchronizeSeriesWithTmdbMutation.graphql';
import unsubscribeFromSeriesMutation from './graphql/UnsubscribeFromSeriesMutation.graphql';
import updateSubscriptionSettingsMutation from './graphql/UpdateSubscriptionSettingsMutation.graphql';
import watchSeriesLaterMutation from './graphql/WatchSeriesLaterMutation.graphql';
import removeSeriesFromWatchLaterMutation from './graphql/RemoveSeriesFromWatchLaterMutation.graphql';
import watchEpisodeFromSeasonMutation from './graphql/WatchEpisodeFromSeasonMutation.graphql';
import {MediaGrid, MediaGridItem} from '~/shared/media';

export interface Props {
  id?: string;
  handle?: string;
}

export default function Series({id, handle}: Props) {
  const {data, refetch, isLoading} = useQuery(seriesQuery, {
    variables: {id, handle},
  });

  usePerformanceNavigation({state: isLoading ? 'loading' : 'complete'});

  if (data?.series == null) {
    return null;
  }

  const {series} = data;

  return (
    <SeriesWithData
      series={series}
      onUpdate={async () => {
        await refetch();
      }}
    />
  );
}

function SeriesWithData({
  series,
  onUpdate,
}: {
  series: NonNullable<SeriesQueryData['series']>;
  onUpdate(): Promise<void>;
}) {
  const {seasons, watchThroughs, subscription} = series;

  const regularSeasons = series.seasons
    .filter(({isSpecials}) => !isSpecials)
    .sort((a, b) => a.number - b.number);
  const firstAired = regularSeasons.find(
    ({firstAired}) => firstAired != null,
  )?.firstAired;
  const lastAired = regularSeasons
    .reverse()
    .find(({firstAired}) => firstAired != null)?.firstAired;
  const seasonCount = regularSeasons.length;

  const betweenText = firstAired
    ? lastAired && lastAired !== firstAired
      ? `${new Date(firstAired).getFullYear()}–${new Date(
          lastAired,
        ).getFullYear()}`
      : String(new Date(firstAired).getFullYear())
    : undefined;

  return (
    <BlockStack spacing="large.2" padding>
      <BlockStack spacing>
        <Header>
          <InlineGrid
            spacing
            blockAlignment="start"
            sizes={[Style.css`6rem`, 'fill']}
          >
            <Poster source={series.poster?.source} />

            <BlockStack spacing>
              <BlockStack spacing="small" inlineAlignment="start">
                <HeadingAction
                  overlay={
                    <Popover inlineAttachment="start">
                      <Menu label="See series in…">
                        <Action
                          to={series.tmdbUrl}
                          target="new"
                          icon="arrow.end"
                        >
                          TMDB
                        </Action>
                        {series.imdbUrl && (
                          <Action
                            to={series.imdbUrl}
                            target="new"
                            icon="arrow.end"
                          >
                            IMDB
                          </Action>
                        )}
                      </Menu>

                      <Menu label="Internal…">
                        <SynchronizeSeriesWithTmdbAction
                          seriesId={series.id}
                          onUpdate={onUpdate}
                        />
                        <DeleteSeriesAction seriesId={series.id} />
                      </Menu>
                    </Popover>
                  }
                >
                  {series.name}
                </HeadingAction>
                <InlineStack spacing="small">
                  <Text emphasis="subdued">
                    {seasonCount} {seasonCount === 1 ? 'Season' : 'Seasons'}
                    {betweenText ? ` • ${betweenText}` : ''}
                  </Text>
                  <SeriesStatusTag status={series.status} />
                </InlineStack>
              </BlockStack>

              <InlineGrid
                spacing="small"
                sizes={Style.value(['fill'], {
                  value: ['fill', 'fill'],
                  viewport: {min: 'large'},
                })}
              >
                <WatchSeriesAction
                  id={series.id}
                  watchThroughs={watchThroughs}
                />

                <WatchlistAction
                  id={series.id}
                  inWatchLater={series.inWatchLater}
                  onUpdate={onUpdate}
                />
              </InlineGrid>
            </BlockStack>
          </InlineGrid>
        </Header>

        {series.overview && <TextBlock>{series.overview}</TextBlock>}
      </BlockStack>

      <AccessoryClips
        id={series.id}
        name={series.name}
        installations={series.clipsInstallations}
      />

      <SeasonsSection id={series.id} seasons={seasons} onUpdate={onUpdate} />

      <WatchThroughsSection watchThroughs={watchThroughs} />

      <SettingsSection
        id={series.id}
        subscription={subscription}
        onUpdate={onUpdate}
      />
    </BlockStack>
  );
}

function AccessoryClips({
  id,
  name,
  installations,
}: {
  id: string;
  name: string;
  installations: SeriesQueryData.Series['clipsInstallations'];
}) {
  const accessoryClips = useClips('series.details.accessory', installations, {
    id,
    name,
  });

  if (accessoryClips.length === 0) return null;

  return (
    <BlockStack spacing="large">
      {accessoryClips.map((clip) => (
        <Clip key={clip.id} extension={clip} />
      ))}
    </BlockStack>
  );
}

function SeriesStatusTag({status}: {status: SeriesQueryData.Series['status']}) {
  switch (status) {
    case 'ENDED':
      return <Tag>Ended</Tag>;
    case 'CANCELLED':
      return <Tag>Cancelled</Tag>;
    case 'RETURNING':
      return <Tag>Continuing</Tag>;
    case 'IN_PRODUCTION':
      return <Tag>In production</Tag>;
  }
}

function WatchSeriesAction({
  id,
  watchThroughs,
}: Pick<SeriesQueryData.Series, 'id' | 'watchThroughs'>) {
  const navigate = useNavigate();
  const startWatchThrough = useMutation(startWatchThroughMutation);
  const ongoingWatchThrough = watchThroughs.find(
    ({status}) => status === 'ONGOING',
  );

  if (ongoingWatchThrough != null) {
    return (
      <Action icon="watch" to={ongoingWatchThrough.url}>
        Watching Season{' '}
        {ongoingWatchThrough.nextEpisode?.seasonNumber ??
          ongoingWatchThrough.to.season}
      </Action>
    );
  }

  return (
    <Action
      icon="watch"
      onPress={async () => {
        await startWatchThrough.mutateAsync(
          {
            series: id,
            from: {season: 1},
          },
          {
            onSuccess({startWatchThrough}) {
              const url = startWatchThrough?.watchThrough?.url;
              if (url) navigate(url);
            },
          },
        );
      }}
    >
      {watchThroughs.length > 0 ? 'Watch again' : 'Watch'}
    </Action>
  );
}

function WatchlistAction({
  id,
  inWatchLater,
  onUpdate,
}: Pick<SeriesQueryData.Series, 'id' | 'inWatchLater'> & {
  onUpdate(): Promise<void>;
}) {
  const watchSeriesLater = useMutation(watchSeriesLaterMutation);
  const removeSeriesFromWatchLater = useMutation(
    removeSeriesFromWatchLaterMutation,
  );

  const inWatchList = useSignal(inWatchLater, [inWatchLater]);

  return (
    <Action
      inlineSize="fill"
      icon="watchlist"
      selected={inWatchList}
      onPress={async () => {
        const isInWatchList = inWatchList.value;
        inWatchList.value = !isInWatchList;

        if (isInWatchList) {
          await removeSeriesFromWatchLater.mutateAsync(
            {id},
            {onSuccess: onUpdate},
          );
        } else {
          await watchSeriesLater.mutateAsync({id}, {onSuccess: onUpdate});
        }
      }}
    >
      Watchlist
    </Action>
  );
}

function SynchronizeSeriesWithTmdbAction({
  seriesId,
  onUpdate,
}: {
  seriesId: string;
  onUpdate(): Promise<void>;
}) {
  const sync = useMutation(synchronizeSeriesWithTmdbMutation);

  return (
    <Action
      icon="sync"
      onPress={async () => {
        await sync.mutateAsync({id: seriesId});
        await onUpdate();
      }}
    >
      Synchronize with TMDB
    </Action>
  );
}

function DeleteSeriesAction(props: ComponentProps<typeof DeleteSeriesModal>) {
  return (
    <Action
      icon="delete"
      role="destructive"
      overlay={<DeleteSeriesModal {...props} />}
    >
      Delete…
    </Action>
  );
}

function DeleteSeriesModal({seriesId}: {seriesId: string}) {
  const navigate = useNavigate();
  const deleteSeries = useMutation(deleteSeriesMutation);

  return (
    <Modal padding>
      <BlockStack spacing="large">
        <Heading>Delete series</Heading>
        <TextBlock>
          This will fail if any watchthroughs or lists reference the series.
        </TextBlock>
        <InlineStack alignment="end">
          <Action
            role="destructive"
            onPress={async () => {
              const result = await deleteSeries.mutateAsync({id: seriesId});

              if (result?.deleteSeries.deletedId == null) {
                // TODO: handle error
                return;
              }

              navigate('/app', {replace: true});
            }}
          >
            Delete
          </Action>
        </InlineStack>
      </BlockStack>
    </Modal>
  );
}

function SeasonsSection({
  id: seriesId,
  seasons,
  onUpdate,
}: Pick<SeriesQueryData.Series, 'id' | 'seasons'> & {
  onUpdate(): Promise<void>;
}) {
  if (seasons.length === 0) return null;

  const lastSeason = seasons[seasons.length - 1]!;

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Seasons</Heading>
        {seasons.map((season) => {
          const {
            id,
            number,
            isSpecials,
            isUpcoming,
            isCurrentlyAiring,
            status,
            firstAired,
            poster,
            episodeCount,
          } = season;

          return (
            <BlockStack key={id} spacing>
              <InlineGrid
                spacing
                blockAlignment="start"
                sizes={[Style.css`4rem`, 'fill', 'auto']}
              >
                <Poster source={poster?.source} />

                <BlockStack spacing="small.2">
                  <InlineStack spacing="small">
                    <TextAction
                      emphasis
                      overlay={
                        <SeasonActionPopover
                          season={season}
                          onUpdate={onUpdate}
                        />
                      }
                    >
                      {isSpecials ? 'Specials' : `Season ${number}`}
                    </TextAction>
                  </InlineStack>

                  <Text emphasis="subdued">
                    {episodeCount} {episodeCount === 1 ? 'episode' : 'episodes'}
                  </Text>

                  {firstAired || status === 'CONTINUING' ? (
                    <InlineStack spacing="small">
                      {firstAired && (
                        <Text emphasis="subdued">
                          {new Date(firstAired).getFullYear()}
                        </Text>
                      )}

                      {isCurrentlyAiring ? (
                        <Tag>Ongoing</Tag>
                      ) : isUpcoming ? (
                        <Tag>Upcoming</Tag>
                      ) : null}
                    </InlineStack>
                  ) : null}
                </BlockStack>

                {isUpcoming ? null : (
                  <SeasonWatchThroughAction
                    seriesId={seriesId}
                    season={season}
                    lastSeason={lastSeason}
                  />
                )}
              </InlineGrid>
              <SeasonEpisodesSection id={id} seriesId={seriesId} />
            </BlockStack>
          );
        })}
      </BlockStack>
    </Section>
  );
}

function SeasonActionPopover({
  season,
  onUpdate,
}: {
  season: SeriesQueryData.Series.Seasons;
  onUpdate(): Promise<void>;
}) {
  const markSeasonAsFinished = useMutation(markSeasonAsFinishedMutation);

  return (
    <Popover inlineAttachment="start">
      <Menu label="See season in…">
        <Action icon="arrow.end" to={season.tmdbUrl} target="new">
          TMDB
        </Action>
        <Action icon="arrow.end" to={season.imdbUrl} target="new">
          IMDB
        </Action>
      </Menu>

      {season.status === 'CONTINUING' && (
        <Menu label="Internal…">
          <Action
            icon="stop"
            onPress={async () => {
              await markSeasonAsFinished.mutateAsync(
                {id: season.id},
                {onSuccess: onUpdate},
              );
            }}
          >
            Mark finished
          </Action>
        </Menu>
      )}
    </Popover>
  );
}

function SeasonWatchThroughAction({
  seriesId,
  season,
  lastSeason,
}: {
  seriesId: string;
  season: SeriesQueryData.Series.Seasons;
  lastSeason: SeriesQueryData.Series.Seasons;
}) {
  const navigate = useNavigate();
  const startWatchThrough = useMutation(startWatchThroughMutation);

  const accessory =
    season.id === lastSeason.id ? null : (
      <Action
        icon="more"
        accessibilityLabel="More actions…"
        overlay={
          <Popover>
            <Menu>
              <Action
                icon="watch"
                onPress={async () => {
                  await startWatchThrough.mutateAsync(
                    {
                      series: seriesId,
                      from: {season: season.number},
                      to: {season: lastSeason.number},
                    },
                    {
                      onSuccess({startWatchThrough}) {
                        const url = startWatchThrough?.watchThrough?.url;
                        if (url) navigate(url);
                      },
                    },
                  );
                }}
              >
                Watch from season {season.number} to {lastSeason.number}
              </Action>
            </Menu>
          </Popover>
        }
      />
    );

  return (
    <Action
      accessory={accessory}
      onPress={async () => {
        await startWatchThrough.mutateAsync(
          {
            series: seriesId,
            from: {season: season.number},
            to: {season: season.number},
          },
          {
            onSuccess({startWatchThrough}) {
              const url = startWatchThrough?.watchThrough?.url;
              if (url) navigate(url);
            },
          },
        );
      }}
    >
      Watch
    </Action>
  );
}

function SeasonEpisodesSection({id, seriesId}: {id: string; seriesId: string}) {
  return (
    <Disclosure label="Episodes">
      <SeasonEpisodesList id={id} seriesId={seriesId} />
    </Disclosure>
  );
}

function SeasonEpisodesList({id, seriesId}: {id: string; seriesId: string}) {
  const {data} = useQuery(seasonEpisodesQuery, {variables: {id}});
  const season = data?.season;

  if (season == null) return null;

  const {episodes} = season;

  return (
    <MediaGrid>
      {episodes.map((episode) => {
        return (
          <MediaGridItem
            key={episode.id}
            image={<EpisodeImage source={episode.still?.source} />}
            menu={
              <Menu>
                <WatchEpisodeAction episode={episode} />
                <WatchSeasonFromEpisodeAction
                  episode={episode}
                  season={season}
                  seriesId={seriesId}
                />
              </Menu>
            }
          >
            <BlockStack padding="small" spacing="small.2">
              <Text emphasis="subdued" size="small.2">
                Episode {episode.number}
              </Text>
              <Text emphasis>{episode.title}</Text>
            </BlockStack>
          </MediaGridItem>
        );
      })}
    </MediaGrid>
  );
}

function WatchEpisodeAction({
  episode,
}: {
  episode: SeasonEpisodesQueryData.Season.Episodes;
}) {
  const watchEpisodeFromSeason = useMutation(watchEpisodeFromSeasonMutation);

  return (
    <Action
      icon="watch"
      onPress={async () => {
        await watchEpisodeFromSeason.mutateAsync({episode: episode.id});
      }}
    >
      Mark as watched…
    </Action>
  );
}

function WatchSeasonFromEpisodeAction({
  episode,
  season,
  seriesId,
}: {
  episode: SeasonEpisodesQueryData.Season.Episodes;
  season: SeasonEpisodesQueryData.Season;
  seriesId: string;
}) {
  const startWatchThrough = useMutation(startWatchThroughMutation);
  const navigate = useNavigate();

  return (
    <Action
      icon="watch"
      onPress={async () => {
        await startWatchThrough.mutateAsync(
          {
            series: seriesId,
            from: {season: season.number, episode: episode.number},
            to: {season: season.number},
          },
          {
            onSuccess({startWatchThrough}) {
              const url = startWatchThrough?.watchThrough?.url;
              if (url) navigate(url);
            },
          },
        );
      }}
    >
      Watch from Episode {episode.number}
    </Action>
  );
}

function WatchThroughsSection({
  watchThroughs,
}: Pick<SeriesQueryData.Series, 'watchThroughs'>) {
  if (watchThroughs.length === 0) return null;

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Watches</Heading>
        <ActionList>
          {watchThroughs.map((watchThrough) => (
            <Action
              key={watchThrough.id}
              to={watchThrough.url}
              inlineAlignment="start"
              detail={<Icon source="disclosure.inline.end" />}
            >
              <BlockStack spacing="small.2">
                <Text emphasis>
                  {watchThrough.from.season === watchThrough.to.season ? (
                    `Season ${watchThrough.from.season}`
                  ) : (
                    <>
                      From <EpisodeSliceText {...watchThrough.from} /> to{' '}
                      <EpisodeSliceText {...watchThrough.to} />
                    </>
                  )}
                </Text>
                <Text emphasis="subdued">
                  {watchThrough.finishedAt
                    ? `Finished on ${new Intl.DateTimeFormat().format(
                        new Date(watchThrough.finishedAt),
                      )}`
                    : watchThrough.unfinishedEpisodeCount > 0
                    ? `${watchThrough.unfinishedEpisodeCount} episodes left`
                    : 'Still watching'}
                </Text>
              </BlockStack>
            </Action>
          ))}
        </ActionList>
      </BlockStack>
    </Section>
  );
}

function SettingsSection({
  id,
  subscription,
  onUpdate,
}: Pick<SeriesQueryData.Series, 'id' | 'subscription'> & {
  onUpdate(): Promise<void>;
}) {
  const subscribeToSeries = useMutation(subscribeToSeriesMutation);
  const unsubscribeFromSeries = useMutation(unsubscribeFromSeriesMutation);

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Settings</Heading>
        {subscription ? (
          <Action
            selected
            onPress={async () => {
              await unsubscribeFromSeries.mutateAsync({id});
              await onUpdate();
            }}
          >
            Unsubscribe
          </Action>
        ) : (
          <Action
            onPress={async () => {
              await subscribeToSeries.mutateAsync({id});
              await onUpdate();
            }}
          >
            Subscribe
          </Action>
        )}
        {subscription && (
          <SpoilerAvoidanceSection
            id={id}
            spoilerAvoidance={subscription.settings.spoilerAvoidance}
            onUpdate={onUpdate}
          />
        )}
      </BlockStack>
    </Section>
  );
}

function EpisodeSliceText({
  season,
  episode,
}: {
  season: number;
  episode?: number | null;
}) {
  return (
    <>
      Season {season}
      {episode == null || episode === 1 ? '' : `, Episode ${episode}`}
    </>
  );
}

function SpoilerAvoidanceSection({
  id,
  spoilerAvoidance,
  onUpdate,
}: {
  id: string;
  spoilerAvoidance: SeriesQueryData.Series.Subscription.Settings['spoilerAvoidance'];
  onUpdate(): Promise<void>;
}) {
  const spoilerAvoidanceSignal = useSignal(spoilerAvoidance, [
    spoilerAvoidance,
  ]);

  const updateSubscriptionSettings = useMutation(
    updateSubscriptionSettingsMutation,
  );

  return (
    <SpoilerAvoidance
      value={spoilerAvoidanceSignal}
      onChange={async (spoilerAvoidance) => {
        spoilerAvoidanceSignal.value = spoilerAvoidance;

        await updateSubscriptionSettings.mutateAsync({
          id,
          spoilerAvoidance,
        });

        await onUpdate();
      }}
    />
  );
}
