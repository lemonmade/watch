import {SkeletonTextBlock as UiSkeletonTextBlock} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const SkeletonTextBlock = createClipsComponent(
  'ui-skeleton-text-block',
  function SkeletonTextBlock({children}) {
    return <UiSkeletonTextBlock>{children}</UiSkeletonTextBlock>;
  },
);
