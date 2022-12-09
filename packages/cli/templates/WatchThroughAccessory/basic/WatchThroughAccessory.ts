import {
  extension,
  getQuery,
  BlockStack,
  TextBlock,
  Text,
} from '@watching/clips';
import {type WatchThroughQueryData} from './WatchThroughQuery.graphql';

export default extension((root, {query, target}) => {
  const {watchThrough} = getQuery<WatchThroughQueryData>(query);
  const {series, currentWatch} = watchThrough;

  let currentWatchContent = contentForCurrentWatch(currentWatch);
  const seriesNameText = root.createText(series.name);
  const blockStack = root.createComponent(BlockStack, {spacing: true});

  blockStack.append(
    root.createComponent(TextBlock, {}, [
      'You are rendering in the ',
      root.createComponent(Text, {emphasis: true}, target),
      ' extension point, on a watch-through of a series named ',
      root.createComponent(Text, {emphasis: true}, seriesNameText),
      '!',
    ]),
  );

  if (currentWatchContent != null) {
    blockStack.append(currentWatchContent);
  }

  query.subscribe(() => {
    const {watchThrough} = getQuery<WatchThroughQueryData>(query);
    const {series, currentWatch} = watchThrough;

    currentWatchContent?.remove();
    currentWatchContent = contentForCurrentWatch(currentWatch);

    if (currentWatchContent != null) {
      blockStack.append(currentWatchContent);
    }

    seriesNameText.update(series.name);
  });

  function contentForCurrentWatch(
    currentWatch: WatchThroughQueryData.WatchThrough['currentWatch'],
  ) {
    if (currentWatch == null) {
      return null;
    }

    if (currentWatch.rating == null) {
      return root.createComponent(
        TextBlock,
        {},
        'You haven’t rated this episode yet.',
      );
    }

    return root.createComponent(TextBlock, {}, [
      'You’ve rated this episode ',
      root.createComponent(Text, {emphasis: true}, String(currentWatch.rating)),
      '.',
    ]);
  }
});
