import {useMemo} from 'react';
import {useNavigate} from '@quilted/quilt';
import {
  View,
  Action,
  BlockStack,
  InlineStack,
  Text,
  Section,
  Heading,
  Icon,
} from '@lemon/zest';

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
  const updateSubscriptionSettings = useMutation(
    updateSubscriptionSettingsMutation,
  );
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

  return (
    <Page heading={series.name}>
      <BlockStack spacing="large">
        {series.overview && <Text>{series.overview}</Text>}
        <InlineStack spacing="small">
          <Action to={series.tmdbUrl}>TMDB</Action>
          <Action to={series.imdbUrl}>IMDB</Action>
        </InlineStack>
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
                            `/app/watchthrough/${parseGid(watchThroughId).id}`,
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
        <View>
          <Action
            onPress={() => {
              startWatchThrough.mutate(
                {series: series.id},
                {
                  onSuccess({startWatchThrough}) {
                    const watchThroughId = startWatchThrough?.watchThrough?.id;

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
            Start watch through
          </Action>
        </View>
        {watchThroughs.length > 0 && (
          <Section>
            <BlockStack spacing>
              <Heading divider>Watches</Heading>
              <BlockStack spacing="small">
                {watchThroughs.map((watchThrough) => (
                  <Action
                    key={watchThrough.id}
                    to={`/app/watchthrough/${parseGid(watchThrough.id).id}`}
                    inlineAlignment="start"
                    detail={<Icon source="arrowEnd" />}
                  >
                    <BlockStack spacing="tiny">
                      <Text>
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
              </BlockStack>
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
              <SpoilerAvoidance
                value={subscription.settings.spoilerAvoidance}
                onChange={(spoilerAvoidance) => {
                  updateSubscriptionSettings.mutate(
                    {
                      id: series.id,
                      spoilerAvoidance,
                    },
                    {onSuccess: onUpdate},
                  );
                }}
              />
            )}
          </BlockStack>
        </Section>
        <Section>
          <BlockStack spacing>
            <Heading divider>Watch later</Heading>
            {series.inWatchLater ? (
              <Action
                onPress={() => {
                  removeSeriesFromWatchLater.mutate(
                    {id: series.id},
                    {onSuccess: onUpdate},
                  );
                }}
              >
                Remove from watch later
              </Action>
            ) : (
              <Action
                onPress={() => {
                  watchSeriesLater.mutate(
                    {id: series.id},
                    {onSuccess: onUpdate},
                  );
                }}
              >
                Watch later
              </Action>
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
      season {season}
      {episode == null || episode === 1 ? '' : `, episode ${episode}`}
    </>
  );
}
