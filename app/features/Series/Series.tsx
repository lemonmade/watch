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
import {parseGid} from 'utilities/graphql';

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
      <Clip
        local
        extensionPoint="Watch::Series::Details"
        version="unstable"
        api={{}}
        components={{Text, View}}
        script="http://localhost:3000/assets/survivor-season-rankings.js"
      />
      {clipsInstallations.map(({id, version}) => (
        <Clip
          key={id}
          extensionPoint="Watch::Series::Details"
          version={version.apiVersion}
          api={{}}
          components={{Text, View}}
          script={version.assets[0].source}
        />
      ))}
    </BlockStack>
  );
}
