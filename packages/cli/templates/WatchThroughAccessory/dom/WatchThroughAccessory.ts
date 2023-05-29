import '@watching/clips/elements';
import {extension, html, type Elements} from '@watching/clips';

import {type WatchThroughQueryData} from './WatchThroughQuery.graphql';

export default extension<
  'watch-through.details.accessory',
  WatchThroughQueryData
>((root, {query, target}) => {
  const seriesNameText = document.createTextNode('');
  let currentWatchContent: ReturnType<typeof CurrentWatch> = null;

  const blockStack = html<Elements.BlockStack>`
    <ui-block-stack spacing>
      <ui-text-block>
        You are rendering the <ui-text emphasis>${target}</ui-text> extension
        point, on a watch-through of a series named
        <ui-text emphasis>${seriesNameText}</ui-text>!
      </ui-text-block>
      ${currentWatchContent}
    </ui-block-stack>
  `;

  query.subscribe(({watchThrough}) => {
    const {series, currentWatch} = watchThrough;

    currentWatchContent?.remove();
    currentWatchContent = CurrentWatch({currentWatch});

    if (currentWatchContent != null) {
      blockStack.append(currentWatchContent);
    }

    seriesNameText.data = series.name;
  });

  root.append(blockStack);
});

function CurrentWatch({
  currentWatch,
}: Pick<WatchThroughQueryData.WatchThrough, 'currentWatch'>) {
  if (currentWatch == null) {
    return null;
  }

  if (currentWatch.rating == null) {
    return html<Elements.TextBlock>`<ui-text-block>
      You haven’t rated this episode yet.
    </ui-text-block>`;
  }

  return html<Elements.TextBlock>`
    <ui-text-block>
      You’ve rated this episode
      <ui-text emphasis>${currentWatch.rating}</ui-text>.
    </ui-text-block>
  `;
}
