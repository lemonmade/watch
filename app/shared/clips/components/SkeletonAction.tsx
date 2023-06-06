import {SkeletonAction as UiSkeletonAction} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const SkeletonAction = createClipsComponent(
  'ui-skeleton-action',
  function SkeletonAction({children}) {
    return <UiSkeletonAction>{children}</UiSkeletonAction>;
  },
);
