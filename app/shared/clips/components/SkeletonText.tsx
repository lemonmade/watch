import {SkeletonText as UiSkeletonText} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const SkeletonText = createClipsComponent(
  'ui-skeleton-text',
  function SkeletonText({children, emphasis, size}) {
    return (
      <UiSkeletonText emphasis={emphasis} size={size}>
        {children}
      </UiSkeletonText>
    );
  },
);
