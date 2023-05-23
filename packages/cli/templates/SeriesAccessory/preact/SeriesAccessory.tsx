import {
  extension,
  useQuery,
  useApi,
  Text,
  TextBlock,
} from '@watching/clips-preact';
import {type SeriesQueryData} from './SeriesQuery.graphql';

export function Extension() {
  const {target} = useApi();
  const {series} = useQuery<SeriesQueryData>();

  return (
    <TextBlock>
      You are rendering in the <Text emphasis>{target}</Text> extension point,
      on a series named <Text emphasis>{series.name}</Text>!
    </TextBlock>
  );
}

export default extension<'series.details.accessory', SeriesQueryData>(() => (
  <Extension />
));
