import {useRouter, useQuery, useMutation} from '@quilted/quilt';
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
import startWatchThroughMutation from './graphql/StartWatchThroughMutation.graphql';
import subscribeToSeriesMutation from './graphql/SubscribeToSeriesMutation.graphql';
import markSeasonAsFinishedMutation from './graphql/MarkSeasonAsFinishedMutation.graphql';

interface Props {
  id: string;
}

export function Series({id}: Props) {
  const router = useRouter();
  const {data} = useQuery(seriesQuery, {
    variables: {id},
  });
  const startWatchThrough = useMutation(startWatchThroughMutation);
  const subscribeToSeries = useMutation(subscribeToSeriesMutation);
  const markSeasonAsFinished = useMutation(markSeasonAsFinishedMutation);

  const localDevelopmentClips = useLocalDevelopmentClips(
    'Watch::Series::Details',
  );

  if (data?.series == null) {
    return null;
  }

  const {series, clipsInstallations} = data;

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
                    router.navigate(
                      `/watchthrough/${parseGid(watchThroughId).id}`,
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
              router.navigate(
                `/watchthrough/${watchThroughId.split('/').pop()}`,
              );
          }}
        >
          Start watch through
        </Button>
      </View>
      {localDevelopmentClips.map(({script, version, socketUrl}) => (
        <SeriesDetailsClip
          key={id}
          version={version}
          script={script}
          local={socketUrl}
        />
      ))}
      {clipsInstallations.map(({id, version}) => (
        <SeriesDetailsClip
          key={id}
          version={version.apiVersion}
          script={version.assets[0].source}
        />
      ))}
    </BlockStack>
  );
}

function SeriesDetailsClip(
  props: Pick<
    ClipProps<'Watch::Series::Details'>,
    'script' | 'version' | 'local'
  >,
) {
  return (
    <Clip
      api={{}}
      extensionPoint="Watch::Series::Details"
      components={{Text, View}}
      {...props}
    />
  );
}
