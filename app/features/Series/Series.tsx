import React from 'react';
import {useQuery, useMutation} from '@apollo/react-hooks';
import {useRouter} from '@lemon/react-router';

import {Text, Link, Button, Stack, View} from '../../components';

import seriesQuery from './graphql/SeriesQuery.graphql';
import startWatchThroughMutation from './graphql/StartWatchThroughMutation.graphql';

interface Props {
  id: string;
}

export function Series({id}: Props) {
  const router = useRouter();
  const {data} = useQuery(seriesQuery, {
    variables: {id},
  });
  const [startWatchThrough] = useMutation(startWatchThroughMutation);

  if (data?.series == null) {
    return null;
  }

  const {series} = data;

  return (
    <Stack>
      <Text>{series.name}</Text>
      {series.overview && <Text>{series.overview}</Text>}
      {series.imdbId && (
        <Link to={`https://www.imdb.com/title/${series.imdbId}`}>IMDB</Link>
      )}
      <Stack>
        {series.seasons.map(({id, number}: any) => (
          <View key={id}>
            <Text>Season number {number}</Text>
            <Stack direction="inline">
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
                      `/watchthrough/${watchThroughId.split('/').pop()}`,
                    );
                }}
              >
                Start season watch through
              </Button>
            </Stack>
          </View>
        ))}
      </Stack>
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
    </Stack>
  );
}
