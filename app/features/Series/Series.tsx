import {type ComponentProps} from 'react';
import {useNavigate, useSignal} from '@quilted/quilt';
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
  Menu,
  Layout,
  Popover,
  raw,
  Tag,
  Modal,
  TextBlock,
  Poster,
} from '@lemon/zest';

import {SpoilerAvoidance} from '~/shared/spoilers';

import {parseGid, useQuery, useMutation} from '~/shared/graphql';
import {
  useLocalDevelopmentClips,
  LocalClip,
  InstalledClip,
} from '~/shared/clips';

import seriesQuery, {type SeriesQueryData} from './graphql/SeriesQuery.graphql';
import startWatchThroughMutation from './graphql/StartWatchThroughMutation.graphql';
import subscribeToSeriesMutation from './graphql/SubscribeToSeriesMutation.graphql';
import markSeasonAsFinishedMutation from './graphql/MarkSeasonAsFinishedMutation.graphql';
import deleteSeriesMutation from './graphql/DeleteSeriesMutation.graphql';
import synchronizeSeriesWithTmdbMutation from './graphql/SynchronizeSeriesWithTmdbMutation.graphql';
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
      onUpdate={async () => {
        await refetch();
      }}
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
  onUpdate(): Promise<void>;
}) {
  const localDevelopmentClips = useLocalDevelopmentClips(
    'Series.Details.RenderAccessory',
  );

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
    <BlockStack spacing="huge" padding>
      <BlockStack spacing>
        <Header>
          <Layout spacing blockAlignment="start" columns={[raw`6rem`, 'fill']}>
            <Poster source={series.poster?.source} />

            <BlockStack spacing>
              <BlockStack spacing="small" inlineAlignment="start">
                <HeadingAction
                  popover={
                    <Popover inlineAttachment="start">
                      <Menu label="See series in…">
                        <Action
                          to={series.tmdbUrl}
                          target="new"
                          icon="arrowEnd"
                        >
                          TMDB
                        </Action>
                        <Action
                          to={series.imdbUrl}
                          target="new"
                          icon="arrowEnd"
                        >
                          IMDB
                        </Action>
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
                  <SeriesStatusTag status={series.status} />
                  <Text emphasis="subdued">
                    {betweenText ? `${betweenText} • ` : ''}
                    {seasonCount} {seasonCount === 1 ? 'Season' : 'Seasons'}
                  </Text>
                </InlineStack>
              </BlockStack>

              <Layout
                spacing="small"
                columns={[
                  {value: ['fill']},
                  {value: ['fill', 'fill'], viewport: {min: 'large'}},
                ]}
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
              </Layout>
            </BlockStack>
          </Layout>
        </Header>

        {series.overview && <TextBlock>{series.overview}</TextBlock>}
      </BlockStack>

      {localDevelopmentClips.length + clipsInstallations.length > 0 ? (
        <BlockStack spacing="large">
          {localDevelopmentClips.map((localClip) => (
            <LocalClip
              {...localClip}
              key={localClip.id}
              extensionPoint="Series.Details.RenderAccessory"
              options={{id: series.id, name: series.name}}
            />
          ))}
          {clipsInstallations.map((installedClip) => (
            <InstalledClip
              {...installedClip}
              key={installedClip.id}
              extensionPoint="Series.Details.RenderAccessory"
              options={{id: series.id, name: series.name}}
            />
          ))}
        </BlockStack>
      ) : null}

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

function SeriesStatusTag({status}: {status: SeriesQueryData.Series['status']}) {
  switch (status) {
    case 'ENDED':
      return <Tag>Ended</Tag>;
    case 'CANCELLED':
      return <Tag>Cancelled</Tag>;
    case 'RETURNING':
      return <Tag>Continuing</Tag>;
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
      modal={<DeleteSeriesModal {...props} />}
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
            <Layout
              key={id}
              spacing
              columns={[raw`4rem`, 'fill', 'auto']}
              blockAlignment="start"
            >
              <Poster source={poster?.source} />

              <BlockStack spacing="tiny">
                <InlineStack spacing="small">
                  <TextAction
                    emphasis
                    popover={
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
            </Layout>
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
        <Action icon="arrowEnd" to={season.tmdbUrl} target="new">
          TMDB
        </Action>
        <Action icon="arrowEnd" to={season.imdbUrl} target="new">
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
