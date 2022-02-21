import {useMemo} from 'react';
import {useQuery, useMutation, useNavigate} from '@quilted/quilt';
import {
  View,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Menu,
  Section,
  Heading,
  TextBlock,
} from '@lemon/zest';

import {Link, LocalClip, InstalledClip, Page} from 'components';
import type {ClipProps} from 'components';
import {parseGid} from 'utilities/graphql';
import {useLocalDevelopmentClips} from 'utilities/clips';

import seriesQuery from './graphql/SeriesQuery.graphql';
import type {SeriesQueryData} from './graphql/SeriesQuery.graphql';
import startWatchThroughMutation from './graphql/StartWatchThroughMutation.graphql';
import subscribeToSeriesMutation from './graphql/SubscribeToSeriesMutation.graphql';
import markSeasonAsFinishedMutation from './graphql/MarkSeasonAsFinishedMutation.graphql';

export interface Props {
  id: string;
}

export default function Series({id}: Props) {
  const {data} = useQuery(seriesQuery, {
    variables: {id},
  });

  if (data?.series == null) {
    return null;
  }

  const {series, clipsInstallations} = data;

  return (
    <SeriesWithData series={series} clipsInstallations={clipsInstallations} />
  );
}

function SeriesWithData({
  series,
  clipsInstallations,
}: {
  series: NonNullable<SeriesQueryData['series']>;
  clipsInstallations: SeriesQueryData['clipsInstallations'];
}) {
  const navigate = useNavigate();
  const startWatchThrough = useMutation(startWatchThroughMutation);
  const subscribeToSeries = useMutation(subscribeToSeriesMutation);
  const markSeasonAsFinished = useMutation(markSeasonAsFinishedMutation);

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
    <Page
      heading={series.name}
      actions={
        <Menu>
          {subscription ? (
            <Link to={`/app/subscriptions/${parseGid(subscription.id).id}`}>
              Subscribed!
            </Link>
          ) : (
            <Button
              onPress={async () => {
                await subscribeToSeries({
                  variables: {id: series.id},
                });
              }}
            >
              Subscribe
            </Button>
          )}
        </Menu>
      }
    >
      {series.overview && <Text>{series.overview}</Text>}
      {series.imdbId && (
        <Link to={`https://www.imdb.com/title/${series.imdbId}`}>IMDB</Link>
      )}
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
        {series.seasons.map(({id, number, status}: any) => (
          <View key={id}>
            <Text>Season number {number}</Text>
            <InlineStack>
              {series.imdbId && (
                <Link
                  to={`https://www.imdb.com/title/${series.imdbId}/episodes?season=${number}`}
                >
                  IMDB
                </Link>
              )}
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
                  onPress={() => {
                    markSeasonAsFinished({variables: {id}});
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
