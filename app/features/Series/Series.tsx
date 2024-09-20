import type {ComponentProps} from 'preact';
import {useSignal} from '@quilted/quilt/signals';
import {useNavigate} from '@quilted/quilt/navigation';
import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {
  Button,
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
  Checkbox,
} from '@lemon/zest';

import {SpoilerAvoidance} from '~/shared/spoilers.ts';
import {
  useGraphQLQuery,
  useGraphQLQueryData,
  useGraphQLMutation,
} from '~/shared/graphql.ts';
import {useClips, Clip} from '~/shared/clips.ts';
import {MediaGrid, MediaGridItem} from '~/shared/media';
import {useUser} from '~/shared/user';

import seriesQuery, {type SeriesQueryData} from './graphql/SeriesQuery.graphql';
import seasonEpisodesQuery, {
  type SeasonEpisodesQueryData,
} from './graphql/SeasonEpisodesQuery.graphql';
import startWatchThroughMutation from './graphql/StartWatchThroughMutation.graphql';
import toggleSubscriptionToSeriesMutation from './graphql/ToggleSubscriptionToSeriesMutation.graphql';
import markSeasonAsFinishedMutation from './graphql/MarkSeasonAsFinishedMutation.graphql';
import deleteSeriesMutation from './graphql/DeleteSeriesMutation.graphql';
import synchronizeSeriesWithTmdbMutation from './graphql/SynchronizeSeriesWithTmdbMutation.graphql';
import updateSubscriptionSettingsMutation from './graphql/UpdateSubscriptionSettingsMutation.graphql';
import watchSeriesLaterMutation from './graphql/WatchSeriesLaterMutation.graphql';
import removeSeriesFromWatchLaterMutation from './graphql/RemoveSeriesFromWatchLaterMutation.graphql';
import watchEpisodeFromSeasonMutation from './graphql/WatchEpisodeFromSeasonMutation.graphql';

export interface Props {
  id?: string;
  handle?: string;
}

export default function Series({id, handle}: Props) {
  const query = useGraphQLQuery(seriesQuery, {
    variables: {id, handle},
  });

  const {series} = useGraphQLQueryData(query);

  usePerformanceNavigation();

  if (series == null) {
    return null;
  }

  return (
    <SeriesWithData
      series={series}
      onUpdate={async () => {
        await query.rerun();
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
  const user = useUser();
  const {seasons, watchThroughs, subscription} = series;

  const regularSeasons = series.seasons
    .filter(({isSpecials}) => !isSpecials)
    .sort((a, b) => a.number - b.number);
  const firstAired = regularSeasons.find(({firstAired}) => firstAired != null)
    ?.firstAired;
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
                        <Button
                          to={series.tmdbUrl}
                          target="new"
                          icon="arrow.end"
                        >
                          TMDB
                        </Button>
                        {series.imdbUrl && (
                          <Button
                            to={series.imdbUrl}
                            target="new"
                            icon="arrow.end"
                          >
                            IMDB
                          </Button>
                        )}
                      </Menu>

                      {user.role === 'ADMIN' && (
                        <Menu label="Admin">
                          <SynchronizeSeriesWithTmdbButton
                            seriesId={series.id}
                            onUpdate={onUpdate}
                          />
                          <DeleteSeriesButton seriesId={series.id} />
                        </Menu>
                      )}
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
                <WatchSeriesButto
                  id={series.id}
                  watchThroughs={watchThroughs}
                />

                <WatchlistButton
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
    case 'PLANNED':
      return <Tag>Planned</Tag>;
  }
}

function WatchSeriesButto({
  id,
  watchThroughs,
}: Pick<SeriesQueryData.Series, 'id' | 'watchThroughs'>) {
  const navigate = useNavigate();
  const startWatchThrough = useGraphQLMutation(startWatchThroughMutation);
  const ongoingWatchThrough = watchThroughs.find(
    ({status}) => status === 'ONGOING',
  );

  if (ongoingWatchThrough != null) {
    return (
      <Button icon="watch" to={ongoingWatchThrough.url}>
        Watching Season{' '}
        {ongoingWatchThrough.nextEpisode?.seasonNumber ??
          ongoingWatchThrough.to.season}
      </Button>
    );
  }

  return (
    <Button
      icon="watch"
      onPress={async () => {
        const result = await startWatchThrough.run({
          series: id,
          from: {season: 1},
        });

        const url = result.data?.startWatchThrough?.watchThrough?.url;
        if (url) navigate(url);
      }}
    >
      {watchThroughs.length > 0 ? 'Watch again' : 'Watch'}
    </Button>
  );
}

function WatchlistButton({
  id,
  inWatchLater,
  onUpdate,
}: Pick<SeriesQueryData.Series, 'id' | 'inWatchLater'> & {
  onUpdate(): Promise<void>;
}) {
  const watchSeriesLater = useGraphQLMutation(watchSeriesLaterMutation);
  const removeSeriesFromWatchLater = useGraphQLMutation(
    removeSeriesFromWatchLaterMutation,
  );

  const inWatchList = useSignal(inWatchLater, [inWatchLater]);

  return (
    <Button
      inlineSize="fill"
      icon="watchlist"
      selected={inWatchList}
      onPress={async () => {
        const isInWatchList = inWatchList.value;
        inWatchList.value = !isInWatchList;

        if (isInWatchList) {
          await removeSeriesFromWatchLater.run({id});
        } else {
          await watchSeriesLater.run({id});
        }

        await onUpdate();
      }}
    >
      Watchlist
    </Button>
  );
}

function SynchronizeSeriesWithTmdbButton({
  seriesId,
  onUpdate,
}: {
  seriesId: string;
  onUpdate(): Promise<void>;
}) {
  const sync = useGraphQLMutation(synchronizeSeriesWithTmdbMutation);

  return (
    <Button
      icon="sync"
      onPress={async () => {
        await sync.run({id: seriesId});
        await onUpdate();
      }}
    >
      Synchronize with TMDB
    </Button>
  );
}

function DeleteSeriesButton(props: ComponentProps<typeof DeleteSeriesModal>) {
  return (
    <Button
      icon="delete"
      role="destructive"
      overlay={<DeleteSeriesModal {...props} />}
    >
      Delete…
    </Button>
  );
}

function DeleteSeriesModal({seriesId}: {seriesId: string}) {
  const navigate = useNavigate();
  const deleteSeries = useGraphQLMutation(deleteSeriesMutation);

  return (
    <Modal padding>
      <BlockStack spacing="large">
        <Heading>Delete series</Heading>
        <TextBlock>
          This will fail if any watchthroughs or lists reference the series.
        </TextBlock>
        <InlineStack alignment="end">
          <Button
            role="destructive"
            onPress={async () => {
              const result = await deleteSeries.run({id: seriesId});

              if (result.data?.deleteSeries.deletedId == null) {
                // TODO: handle error
                return;
              }

              navigate('/app', {replace: true});
            }}
          >
            Delete
          </Button>
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
                  <SeasonWatchThroughButton
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
  const markSeasonAsFinished = useGraphQLMutation(markSeasonAsFinishedMutation);

  return (
    <Popover inlineAttachment="start">
      <Menu label="See season in…">
        <Button icon="arrow.end" to={season.tmdbUrl} target="new">
          TMDB
        </Button>
        <Button icon="arrow.end" to={season.imdbUrl} target="new">
          IMDB
        </Button>
      </Menu>

      {season.status === 'CONTINUING' && (
        <Menu label="Internal…">
          <Button
            icon="stop"
            onPress={async () => {
              await markSeasonAsFinished.run({id: season.id});
              await onUpdate();
            }}
          >
            Mark finished
          </Button>
        </Menu>
      )}
    </Popover>
  );
}

function SeasonWatchThroughButton({
  seriesId,
  season,
  lastSeason,
}: {
  seriesId: string;
  season: SeriesQueryData.Series.Seasons;
  lastSeason: SeriesQueryData.Series.Seasons;
}) {
  const navigate = useNavigate();
  const startWatchThrough = useGraphQLMutation(startWatchThroughMutation);

  const accessory =
    season.id === lastSeason.id ? null : (
      <Button
        icon="more"
        accessibilityLabel="More actions…"
        overlay={
          <Popover>
            <Menu>
              <Button
                icon="watch"
                onPress={async () => {
                  const result = await startWatchThrough.run({
                    series: seriesId,
                    from: {season: season.number},
                    to: {season: lastSeason.number},
                  });

                  const url = result.data?.startWatchThrough?.watchThrough?.url;
                  if (url) navigate(url);
                }}
              >
                Watch from season {season.number} to {lastSeason.number}
              </Button>
            </Menu>
          </Popover>
        }
      />
    );

  return (
    <Button
      accessory={accessory}
      onPress={async () => {
        const result = await startWatchThrough.run({
          series: seriesId,
          from: {season: season.number},
          to: {season: season.number},
        });

        const url = result.data?.startWatchThrough?.watchThrough?.url;
        if (url) navigate(url);
      }}
    >
      Watch
    </Button>
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
  const query = useGraphQLQuery(seasonEpisodesQuery, {
    variables: {id},
    suspend: false,
  });
  const season = query.value?.data?.season;

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
                <WatchEpisodeButton episode={episode} />
                <WatchSeasonFromEpisodeButton
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

function WatchEpisodeButton({
  episode,
}: {
  episode: SeasonEpisodesQueryData.Season.Episodes;
}) {
  const watchEpisodeFromSeason = useGraphQLMutation(
    watchEpisodeFromSeasonMutation,
  );

  return (
    <Button
      icon="watch"
      onPress={async () => {
        await watchEpisodeFromSeason.run({episode: episode.id});
      }}
    >
      Mark as watched…
    </Button>
  );
}

function WatchSeasonFromEpisodeButton({
  episode,
  season,
  seriesId,
}: {
  episode: SeasonEpisodesQueryData.Season.Episodes;
  season: SeasonEpisodesQueryData.Season;
  seriesId: string;
}) {
  const startWatchThrough = useGraphQLMutation(startWatchThroughMutation);
  const navigate = useNavigate();

  return (
    <Button
      icon="watch"
      onPress={async () => {
        const result = await startWatchThrough.run({
          series: seriesId,
          from: {season: season.number, episode: episode.number},
          to: {season: season.number},
        });

        const url = result.data?.startWatchThrough?.watchThrough?.url;
        if (url) navigate(url);
      }}
    >
      Watch from Episode {episode.number}
    </Button>
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
            <Button
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
            </Button>
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
  const toggleSubscriptionToSeries = useGraphQLMutation(
    toggleSubscriptionToSeriesMutation,
  );

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Settings</Heading>
        <Checkbox
          checked={subscription != null}
          onChange={async () => {
            await toggleSubscriptionToSeries.run({id});
            await onUpdate();
          }}
          helpText="Automatically start watching new seasons as they air"
        >
          Subscribe to Series
        </Checkbox>
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

  const updateSubscriptionSettings = useGraphQLMutation(
    updateSubscriptionSettingsMutation,
  );

  return (
    <SpoilerAvoidance
      value={spoilerAvoidanceSignal}
      onChange={async (spoilerAvoidance) => {
        spoilerAvoidanceSignal.value = spoilerAvoidance;

        await updateSubscriptionSettings.run({
          id,
          spoilerAvoidance,
        });

        await onUpdate();
      }}
    />
  );
}
