import {useMemo} from 'react';
import {useQuery, useMutation, useNavigate} from '@quilted/quilt';
import {View, Button, BlockStack, InlineStack, Text, Menu} from '@lemon/zest';

import {Link, LocalClip, InstalledClip, Page} from 'components';
import type {ClipProps} from 'components';
import {parseGid} from 'utilities/graphql';
import {useLocalDevelopmentClips} from 'utilities/clips';

import seriesQuery from './graphql/SeriesQuery.graphql';
import type {SeriesQueryData} from './graphql/SeriesQuery.graphql';
import startWatchThroughMutation from './graphql/StartWatchThroughMutation.graphql';
import subscribeToSeriesMutation from './graphql/SubscribeToSeriesMutation.graphql';
import markSeasonAsFinishedMutation from './graphql/MarkSeasonAsFinishedMutation.graphql';

interface Props {
  id: string;
}

export function Series({id}: Props) {
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
    'Watch::Series::Details',
  );

  const apiForClips = useMemo<
    ClipProps<'Watch::Series::Details'>['api']
  >(() => {
    return () => ({series: {id: series.id, name: series.name}});
  }, [series]);

  return (
    <Page
      heading={series.name}
      actions={
        <Menu>
          <Button
            onPress={async () => {
              await subscribeToSeries({
                variables: {id: series.id},
              });
            }}
          >
            Subscribe
          </Button>
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
            extensionPoint="Watch::Series::Details"
          />
        ))}
        {clipsInstallations.map((installedClip) => (
          <InstalledClip
            {...installedClip}
            key={installedClip.id}
            api={apiForClips}
            extensionPoint="Watch::Series::Details"
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
      </BlockStack>
      <View>
        <Button
          onPress={async () => {
            const {data} = await startWatchThrough({
              variables: {series: series.id},
            });

            const watchThroughId = data?.startWatchThrough?.watchThrough?.id;
            if (watchThroughId)
              navigate(`/app/watchthrough/${watchThroughId.split('/').pop()}`);
          }}
        >
          Start watch through
        </Button>
      </View>
    </Page>
  );
}
