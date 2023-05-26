import '@watching/clips/elements';
import {extension, getQuery} from '@watching/clips';

import {type WatchThroughQueryData} from './WatchThroughQuery.graphql';

export default extension<
  'watch-through.details.accessory',
  WatchThroughQueryData
>((root, {query, target}) => {
  const {watchThrough} = getQuery(query);
  const {series, currentWatch} = watchThrough;

  let currentWatchContent = contentForCurrentWatch(currentWatch);
  const seriesNameText = document.createTextNode(series.name);

  const blockStack = document.createElement('ui-block-stack');
  blockStack.spacing = true;

  const seriesText = document.createElement('ui-text');
  seriesText.emphasis = true;
  seriesText.append(seriesNameText);

  const targetText = document.createElement('ui-text');
  targetText.emphasis = true;
  targetText.append(target);

  const textBlock = document.createElement('ui-text-block');
  textBlock.append(
    'You are rendering in the ',
    targetText,
    ' extension point, on a watch-through of a series named ',
    seriesText,
    '!',
  );

  blockStack.append(textBlock);

  if (currentWatchContent != null) {
    blockStack.append(currentWatchContent);
  }

  root.append(blockStack);

  query.subscribe(() => {
    const {watchThrough} = getQuery(query);
    const {series, currentWatch} = watchThrough;

    currentWatchContent?.remove();
    currentWatchContent = contentForCurrentWatch(currentWatch);

    if (currentWatchContent != null) {
      blockStack.append(currentWatchContent);
    }

    seriesNameText.data = series.name;
  });

  function contentForCurrentWatch(
    currentWatch: WatchThroughQueryData.WatchThrough['currentWatch'],
  ) {
    if (currentWatch == null) {
      return null;
    }

    if (currentWatch.rating == null) {
      const textBlock = document.createElement('ui-text-block');
      textBlock.append('You haven’t rated this episode yet.');
      return textBlock;
    }

    const ratingText = document.createElement('ui-text');
    ratingText.emphasis = true;
    ratingText.append(String(currentWatch.rating));

    const textBlock = document.createElement('ui-text-block');
    textBlock.append('You’ve rated this episode ', ratingText, '.');

    return textBlock;
  }
});
