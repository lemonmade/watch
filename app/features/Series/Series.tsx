import {useMemo} from 'react';
import {useQuery, useMutation, useNavigate} from '@quilted/quilt';
import {
  View,
  Button,
  BlockStack,
  InlineStack,
  Heading,
  Text,
} from '@lemon/zest';

import {Link, Clip} from 'components';
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
    return {series: {id: series.id, name: series.name}};
  }, [series]);

  return (
    <BlockStack>
      <Heading>{series.name}</Heading>
      <View>
        <Button
          onPress={async () => {
            await subscribeToSeries({
              variables: {id: series.id},
            });
          }}
        >
          Subscribe
        </Button>
      </View>
      {series.overview && <Text>{series.overview}</Text>}
      {series.imdbId && (
        <Link to={`https://www.imdb.com/title/${series.imdbId}`}>IMDB</Link>
      )}
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
                    variables: {series: series.id, seasons: [id]},
                  });

                  const watchThroughId =
                    data?.startWatchThrough?.watchThrough?.id;
                  if (watchThroughId)
                    navigate(`/watchthrough/${parseGid(watchThroughId).id}`);
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
              navigate(`/watchthrough/${watchThroughId.split('/').pop()}`);
          }}
        >
          Start watch through
        </Button>
      </View>
      <BlockStack spacing="large">
        {localDevelopmentClips.map(({id, script, name, version, socketUrl}) => (
          <SeriesDetailsClip
            key={id}
            api={apiForClips}
            name={name}
            version={version}
            script={script}
            local={socketUrl}
          />
        ))}
        {clipsInstallations.map(({id, version, extension}) => (
          <SeriesDetailsClip
            key={id}
            api={apiForClips}
            name={extension.name}
            version={version.apiVersion}
            script={version.assets[0].source}
          />
        ))}
      </BlockStack>
    </BlockStack>
  );
}

function SeriesDetailsClip(
  props: Pick<
    ClipProps<'Watch::Series::Details'>,
    'script' | 'version' | 'local' | 'api' | 'name'
  >,
) {
  return (
    <Clip
      extensionPoint="Watch::Series::Details"
      components={{Text, View}}
      {...props}
    />
  );
}
