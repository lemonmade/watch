import {extension, useQuery, Text, useApi} from '@watching/clips-react';
import {type SeriesQueryData} from './SeriesQuery.graphql';

export function Extension() {
  const {target} = useApi();
  const {series} = useQuery<SeriesQueryData>();

  return (
    <Text>
      You are rendering in the <Text emphasis>{target}</Text> extension point,
      on a series named <Text emphasis>{series.name}</Text>!
    </Text>
  );
}

export default extension(() => <Extension />);
