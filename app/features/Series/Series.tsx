import {useMemo} from 'react';
import {useNavigate} from '@quilted/quilt';
import {
  Action,
  ActionList,
  BlockStack,
  InlineStack,
  Text,
  Section,
  Heading,
  Icon,
  Menu,
  Layout,
  Popover,
  Image,
  raw,
  Tag,
} from '@lemon/zest';
import {useSignal} from '@watching/react-signals';

import {Page} from '~/shared/page';
import {SpoilerAvoidance} from '~/shared/spoilers';

import {parseGid, useQuery, useMutation} from '~/shared/graphql';
import {
  useLocalDevelopmentClips,
  LocalClip,
  InstalledClip,
  type ClipProps,
} from '~/shared/clips';

import seriesQuery, {type SeriesQueryData} from './graphql/SeriesQuery.graphql';
import startWatchThroughMutation from './graphql/StartWatchThroughMutation.graphql';
import subscribeToSeriesMutation from './graphql/SubscribeToSeriesMutation.graphql';
import markSeasonAsFinishedMutation from './graphql/MarkSeasonAsFinishedMutation.graphql';
import unsubscribeFromSeriesMutation from './graphql/UnsubscribeFromSeriesMutation.graphql';
import updateSubscriptionSettingsMutation from './graphql/UpdateSubscriptionSettingsMutation.graphql';
import watchSeriesLaterMutation from './graphql/WatchSeriesLaterMutation.graphql';
import removeSeriesFromWatchLaterMutation from './graphql/RemoveSeriesFromWatchLaterMutation.graphql';

export interface Props {
  id?: string;
  handle?: string;
}

export default function Series({id, handle}: Props) {
  const {data, refetch} = useQuery(seriesQuery, {
    variables: {id, handle},
  });

  if (data?.series == null) {
    return null;
  }

  const {series, clipsInstallations} = data;

  return (
    <SeriesWithData
      series={series}
      clipsInstallations={clipsInstallations}
      onUpdate={() => refetch()}
    />
  );
}

function SeriesWithData({
  series,
  clipsInstallations,
  onUpdate,
}: {
  series: NonNullable<SeriesQueryData['series']>;
  clipsInstallations: SeriesQueryData['clipsInstallations'];
  onUpdate(): void;
}) {
  const localDevelopmentClips = useLocalDevelopmentClips(
    'Series.Details.RenderAccessory',
  );

  const apiForClips = useMemo<
    ClipProps<'Series.Details.RenderAccessory'>['api']
  >(() => {
    return () => ({series: {id: series.id, name: series.name}});
  }, [series]);

  const {seasons, watchThroughs, subscription} = series;

  return (
    <Page
      heading={series.name}
      menu={
        <Menu label="See series in…">
          <Action to={series.tmdbUrl} target="new" icon="arrowEnd">
            TMDB
          </Action>
          <Action to={series.imdbUrl} target="new" icon="arrowEnd">
            IMDB
          </Action>
        </Menu>
      }
    >
      <BlockStack spacing="huge">
        <BlockStack spacing>
          {series.overview && <Text>{series.overview}</Text>}

          <Layout
            spacing="small"
            columns={[
              {value: ['fill']},
              {value: ['fill', 'fill'], viewport: {min: 'large'}},
            ]}
          >
            <WatchSeriesAction id={series.id} watchThroughs={watchThroughs} />

            <WatchlistAction
              id={series.id}
              inWatchLater={series.inWatchLater}
              onUpdate={onUpdate}
            />
          </Layout>

          {localDevelopmentClips.map((localClip) => (
            <LocalClip
              {...localClip}
              key={localClip.id}
              api={apiForClips}
              extensionPoint="Series.Details.RenderAccessory"
            />
          ))}
          {clipsInstallations.map((installedClip) => (
            <InstalledClip
              {...installedClip}
              key={installedClip.id}
              api={apiForClips}
              extensionPoint="Series.Details.RenderAccessory"
            />
          ))}
        </BlockStack>

        <SeasonsSection id={series.id} seasons={seasons} onUpdate={onUpdate} />

        <WatchThroughsSection watchThroughs={watchThroughs} />

        <SettingsSection
          id={series.id}
          subscription={subscription}
          onUpdate={onUpdate}
        />
      </BlockStack>
    </Page>
  );
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
      <Action
        icon="watch"
        to={`/app/watchthrough/${parseGid(ongoingWatchThrough.id).id}`}
      >
        Watching Season {ongoingWatchThrough.on!.season}
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
              const watchThroughId = startWatchThrough?.watchThrough?.id;

              if (watchThroughId) {
                navigate(`/app/watchthrough/${parseGid(watchThroughId).id}`);
              }
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
}: Pick<SeriesQueryData.Series, 'id' | 'inWatchLater'> & {onUpdate(): void}) {
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

function SeasonsSection({
  id: seriesId,
  seasons,
  onUpdate,
}: Pick<SeriesQueryData.Series, 'id' | 'seasons'> & {onUpdate(): void}) {
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
            status,
            firstAired,
            poster,
            episodeCount,
          } = season;

          return (
            <Layout
              key={id}
              spacing
              columns={
                poster?.source ? [raw`4rem`, 'fill', 'auto'] : ['fill', 'auto']
              }
              blockAlignment="start"
            >
              {poster?.source ? (
                <Image source={poster.source} aspectRatio={2 / 3} />
              ) : null}

              <BlockStack spacing="tiny">
                <InlineStack spacing="small">
                  <Text emphasis>
                    {isSpecials ? 'Specials' : `Season ${number}`}
                  </Text>

                  <SeasonActions season={season} onUpdate={onUpdate} />
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

                    {status === 'CONTINUING' ? <Tag>Ongoing</Tag> : null}
                  </InlineStack>
                ) : null}
              </BlockStack>

              <SeasonWatchThroughAction
                seriesId={seriesId}
                season={season}
                lastSeason={lastSeason}
              />
            </Layout>
          );
        })}
      </BlockStack>
    </Section>
  );
}

function SeasonActions({
  season,
  onUpdate,
}: {
  season: SeriesQueryData.Series.Seasons;
  onUpdate(): void;
}) {
  const markSeasonAsFinished = useMutation(markSeasonAsFinishedMutation);

  return (
    <Action
      icon="more"
      size="small"
      accessibilityLabel="More actions…"
      popover={
        <Popover>
          <Menu label="See season in…">
            <Action icon="arrowEnd" to={season.tmdbUrl} target="new">
              TMDB
            </Action>
            <Action icon="arrowEnd" to={season.imdbUrl} target="new">
              IMDB
            </Action>
          </Menu>

          {season.status === 'CONTINUING' && (
            <Menu label="Internal">
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
      }
    />
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
        popover={
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
                        const watchThroughId =
                          startWatchThrough?.watchThrough?.id;

                        if (watchThroughId) {
                          navigate(
                            `/app/watchthrough/${parseGid(watchThroughId).id}`,
                          );
                        }
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
              const watchThroughId = startWatchThrough?.watchThrough?.id;

              if (watchThroughId) {
                navigate(`/app/watchthrough/${parseGid(watchThroughId).id}`);
              }
            },
          },
        );
      }}
    >
      Watch
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
              to={`/app/watchthrough/${parseGid(watchThrough.id).id}`}
              inlineAlignment="start"
              detail={<Icon source="disclosureInlineEnd" />}
            >
              <BlockStack spacing="tiny">
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
}: Pick<SeriesQueryData.Series, 'id' | 'subscription'> & {onUpdate(): void}) {
  const subscribeToSeries = useMutation(subscribeToSeriesMutation);
  const unsubscribeFromSeries = useMutation(unsubscribeFromSeriesMutation);

  return (
    <Section>
      <BlockStack spacing>
        <Heading divider>Settings</Heading>
        {subscription ? (
          <Action
            onPress={async () => {
              await unsubscribeFromSeries.mutateAsync(
                {id},
                {onSuccess: onUpdate},
              );
            }}
          >
            Unsubscribe
          </Action>
        ) : (
          <Action
            onPress={async () => {
              await subscribeToSeries.mutateAsync({id}, {onSuccess: onUpdate});
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
  onUpdate(): void;
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
      onChange={(spoilerAvoidance) => {
        spoilerAvoidanceSignal.value = spoilerAvoidance;
        updateSubscriptionSettings.mutate(
          {
            id,
            spoilerAvoidance,
          },
          {onSuccess: onUpdate},
        );
      }}
    />
  );
}
