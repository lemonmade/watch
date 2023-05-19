import {
  extension,
  useQuery,
  useApi,
  Text,
  TextBlock,
  BlockStack,
} from '@watching/clips-preact';
import {type WatchThroughQueryData} from './WatchThroughQuery.graphql';

export function Extension() {
  const {target} = useApi();
  const {watchThrough} = useQuery<WatchThroughQueryData>();
  const {series, currentWatch} = watchThrough;

  let currentWatchContent = null;

  if (currentWatch) {
    currentWatchContent =
      currentWatch.rating == null ? (
        <TextBlock>You haven’t rated this episode yet.</TextBlock>
      ) : (
        <TextBlock>
          You’ve rated this episode <Text emphasis>{currentWatch.rating}</Text>.
        </TextBlock>
      );
  }

  return (
    <BlockStack spacing>
      <TextBlock>
        You are rendering in the <Text emphasis>{target}</Text> extension point,
        on a series named <Text emphasis>{series.name}</Text>!
      </TextBlock>

      {currentWatchContent}
    </BlockStack>
  );
}

export default extension(() => <Extension />);
