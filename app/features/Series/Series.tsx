import {useMemo} from 'react';
import {useNavigate} from '@quilted/quilt';
import {
  View,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Section,
  Heading,
  TextBlock,
} from '@lemon/zest';

import {
  Link,
  LocalClip,
  InstalledClip,
  Page,
  SpoilerAvoidance,
} from '~/components';
import type {ClipProps} from '~/components';

import {parseGid, useQuery, useMutation} from '~/shared/graphql';
import {useLocalDevelopmentClips} from '~/shared/clips';

import seriesQuery, {type SeriesQueryData} from './graphql/SeriesQuery.graphql';
import startWatchThroughMutation from './graphql/StartWatchThroughMutation.graphql';
import subscribeToSeriesMutation from './graphql/SubscribeToSeriesMutation.graphql';
import markSeasonAsFinishedMutation from './graphql/MarkSeasonAsFinishedMutation.graphql';
import unsubscribeFromSeriesMutation from './graphql/UnsubscribeFromSeriesMutation.graphql';
import updateSubscriptionSettingsMutation from './graphql/UpdateSubscriptionSettingsMutation.graphql';
import watchSeriesLaterMutation from './graphql/WatchSeriesLaterMutation.graphql';
import removeSeriesFromWatchLaterMutation from './graphql/RemoveSeriesFromWatchLaterMutation.graphql';

export interface Props {
  id: string;
}

export default function Series({id}: Props) {
  const {data, refetch} = useQuery(seriesQuery, {
    variables: {id},
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
        <InlineStack>
          <Link to={series.tmdbUrl}>TMDB</Link>
          <Link to={series.imdbUrl}>IMDB</Link>
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
            <InlineStack>
              <Link to={tmdbUrl}>TMDB</Link>
              <Link to={imdbUrl}>IMDB</Link>
              <Button
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
              </Button>
              {status === 'CONTINUING' && (
                <Button
                  onPress={() => {
                    markSeasonAsFinished.mutate({id}, {onSuccess: onUpdate});
                  }}
                >
                  Mark finished
                </Button>
              )}
            </InlineStack>
          </View>
        ))}
        <View>
          <Button
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
          </Button>
        </View>
        {watchThroughs.length > 0 && (
          <Section>
            <Heading>Watchthroughs</Heading>
            <BlockStack>
              {watchThroughs.map((watchThrough) => (
                <BlockStack key={watchThrough.id}>
                  <TextBlock>
                    From <EpisodeSliceText {...watchThrough.from} />, to{' '}
                    <EpisodeSliceText {...watchThrough.to} />
                    {watchThrough.status === 'ONGOING'
                      ? ' (still watching)'
                      : ''}
                  </TextBlock>
                  <Link
                    to={`/app/watchthrough/${parseGid(watchThrough.id).id}`}
                  >
                    See watch through
                  </Link>
                </BlockStack>
              ))}
            </BlockStack>
          </Section>
        )}
        <Section>
          <BlockStack>
            <Heading>Subscription</Heading>
            {subscription ? (
              <Button
                onPress={() => {
                  unsubscribeFromSeries.mutate(
                    {id: series.id},
                    {onSuccess: onUpdate},
                  );
                }}
              >
                Unsubscribe
              </Button>
            ) : (
              <Button
                onPress={() => {
                  subscribeToSeries.mutate(
                    {id: series.id},
                    {onSuccess: onUpdate},
                  );
                }}
              >
                Subscribe
              </Button>
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
          <BlockStack>
            <Heading>Watch later</Heading>
            {series.inWatchLater ? (
              <Button
                onPress={() => {
                  removeSeriesFromWatchLater.mutate(
                    {id: series.id},
                    {onSuccess: onUpdate},
                  );
                }}
              >
                Remove from watch later
              </Button>
            ) : (
              <Button
                onPress={() => {
                  watchSeriesLater.mutate(
                    {id: series.id},
                    {onSuccess: onUpdate},
                  );
                }}
              >
                Watch later
              </Button>
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
      {episode == null ? '' : `, episode ${episode}`}
    </>
  );
}
