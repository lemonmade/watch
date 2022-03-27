import {useMemo, useState} from 'react';
import {useQuery, useMutation, useNavigate} from '@quilted/quilt';
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
} from 'components';
import type {ClipProps} from 'components';

import {parseGid} from 'utilities/graphql';
import {useLocalDevelopmentClips} from 'utilities/clips';

import seriesQuery from './graphql/SeriesQuery.graphql';
import type {SeriesQueryData} from './graphql/SeriesQuery.graphql';
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
  const [key, setKey] = useState(0);
  const {data} = useQuery(seriesQuery, {
    variables: {
      id,
      // @ts-expect-error temporary
      key,
    },
  });

  if (data?.series == null) {
    return null;
  }

  const {series, clipsInstallations} = data;

  return (
    <SeriesWithData
      series={series}
      clipsInstallations={clipsInstallations}
      onUpdate={() => setKey((key) => key + 1)}
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
      {series.overview && <Text>{series.overview}</Text>}
      <Link to={series.imdbUrl}>IMDB</Link>
      <BlockStack spacing="large">
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
        {series.seasons.map(({id, number, status, imdbUrl}) => (
          <View key={id}>
            <Text>Season number {number}</Text>
            <InlineStack>
              <Link to={imdbUrl}>IMDB</Link>
              <Button
                onPress={async () => {
                  const {data} = await startWatchThrough({
                    variables: {
                      series: series.id,
                      from: {season: number},
                      to: {season: number},
                    },
                  });

                  const watchThroughId =
                    data?.startWatchThrough?.watchThrough?.id;
                  if (watchThroughId)
                    navigate(
                      `/app/watchthrough/${parseGid(watchThroughId).id}`,
                    );
                }}
              >
                Start season watch through
              </Button>
              {status === 'CONTINUING' && (
                <Button
                  onPress={async () => {
                    await markSeasonAsFinished({variables: {id}});
                    onUpdate();
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
            onPress={async () => {
              const {data} = await startWatchThrough({
                variables: {series: series.id},
              });

              const watchThroughId = data?.startWatchThrough?.watchThrough?.id;
              if (watchThroughId)
                navigate(`/app/watchthrough/${parseGid(watchThroughId).id}`);
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
                onPress={async () => {
                  await unsubscribeFromSeries({
                    variables: {id: series.id},
                  });
                  onUpdate();
                }}
              >
                Unsubscribe
              </Button>
            ) : (
              <Button
                onPress={async () => {
                  await subscribeToSeries({
                    variables: {id: series.id},
                  });
                  onUpdate();
                }}
              >
                Subscribe
              </Button>
            )}
            {subscription && (
              <SpoilerAvoidance
                value={subscription.settings.spoilerAvoidance}
                onChange={async (spoilerAvoidance) => {
                  await updateSubscriptionSettings({
                    variables: {id: series.id, spoilerAvoidance},
                  });
                  onUpdate();
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
                onPress={async () => {
                  await removeSeriesFromWatchLater({
                    variables: {id: series.id},
                  });
                  onUpdate();
                }}
              >
                Remove from watch later
              </Button>
            ) : (
              <Button
                onPress={async () => {
                  await watchSeriesLater({
                    variables: {id: series.id},
                  });
                  onUpdate();
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
