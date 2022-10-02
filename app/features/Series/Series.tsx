import {useMemo} from 'react';
import {useNavigate} from '@quilted/quilt';
import {
  View,
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
  const navigate = useNavigate();
  const startWatchThrough = useMutation(startWatchThroughMutation);
  const subscribeToSeries = useMutation(subscribeToSeriesMutation);
  const markSeasonAsFinished = useMutation(markSeasonAsFinishedMutation);
  const unsubscribeFromSeries = useMutation(unsubscribeFromSeriesMutation);
  const watchSeriesLater = useMutation(watchSeriesLaterMutation);
  const removeSeriesFromWatchLater = useMutation(
    removeSeriesFromWatchLaterMutation,
  );

  const localDevelopmentClips = useLocalDevelopmentClips(
    'Series.Details.RenderAccessory',
  );

  const apiForClips = useMemo<
    ClipProps<'Series.Details.RenderAccessory'>['api']
  >(() => {
    return () => ({series: {id: series.id, name: series.name}});
  }, [series]);

  const {watchThroughs, subscription} = series;

  const ongoingWatchThrough = watchThroughs.find(
    ({status}) => status === 'ONGOING',
  );

  return (
    <Page
      heading={series.name}
      menu={
        <BlockStack>
          {/* <Menu>
            <Action>Nice!</Action>
          </Menu> */}

          <Menu label="See series in…">
            <Action to={series.tmdbUrl} target="new" icon="arrowEnd">
              TMDB
            </Action>
            <Action to={series.imdbUrl} target="new" icon="arrowEnd">
              IMDB
            </Action>
          </Menu>
        </BlockStack>
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
            {ongoingWatchThrough == null ? (
              <Action>Watch</Action>
            ) : (
              <Action
                to={`/app/watchthrough/${parseGid(ongoingWatchThrough.id).id}`}
              >
                Watching Season {ongoingWatchThrough.on.season}
              </Action>
            )}

            <Action
              inlineSize="fill"
              onPress={async () => {
                if (series.inWatchLater) {
                  await removeSeriesFromWatchLater.mutateAsync(
                    {id: series.id},
                    {onSuccess: onUpdate},
                  );
                } else {
                  await watchSeriesLater.mutateAsync(
                    {id: series.id},
                    {onSuccess: onUpdate},
                  );
                }
              }}
            >
              Watchlist
            </Action>
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

        <BlockStack>
          {series.seasons.map(({id, number, status, imdbUrl, tmdbUrl}) => (
            <View key={id}>
              <Text>Season {number}</Text>
              <InlineStack spacing="small">
                <Action to={tmdbUrl} target="new">
                  TMDB
                </Action>
                <Action to={imdbUrl} target="new">
                  IMDB
                </Action>
                <Action
                  onPress={() => {
                    startWatchThrough.mutate(
                      {
                        series: series.id,
                        from: {season: number},
                        to: {season: number},
                      },
                      {
                        onSuccess({startWatchThrough}) {
                          const watchThroughId =
                            startWatchThrough?.watchThrough?.id;

                          if (watchThroughId) {
                            navigate(
                              `/app/watchthrough/${
                                parseGid(watchThroughId).id
                              }`,
                            );
                          }
                        },
                      },
                    );
                  }}
                >
                  Start season watch through
                </Action>
                {status === 'CONTINUING' && (
                  <Action
                    onPress={() => {
                      markSeasonAsFinished.mutate({id}, {onSuccess: onUpdate});
                    }}
                  >
                    Mark finished
                  </Action>
                )}
              </InlineStack>
            </View>
          ))}
        </BlockStack>

        {watchThroughs.length > 0 && (
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
        )}
        <Section>
          <BlockStack spacing>
            <Heading divider>Subscription</Heading>
            {subscription ? (
              <Action
                onPress={() => {
                  unsubscribeFromSeries.mutate(
                    {id: series.id},
                    {onSuccess: onUpdate},
                  );
                }}
              >
                Unsubscribe
              </Action>
            ) : (
              <Action
                onPress={() => {
                  subscribeToSeries.mutate(
                    {id: series.id},
                    {onSuccess: onUpdate},
                  );
                }}
              >
                Subscribe
              </Action>
            )}
            {subscription && (
              <SpoilerAvoidanceSection
                id={series.id}
                spoilerAvoidance={subscription.settings.spoilerAvoidance}
                onUpdate={onUpdate}
              />
            )}
          </BlockStack>
        </Section>
      </BlockStack>
    </Page>
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
