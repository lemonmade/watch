import {SkeletonAction as UiSkeletonAction} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const SkeletonAction = createClipsComponent(
  'ui-skeleton-action',
  function SkeletonAction({size, children}) {
    return <UiSkeletonAction size={size}>{children}</UiSkeletonAction>;
  },
);
