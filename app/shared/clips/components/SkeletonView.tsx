import {SkeletonView as UiSkeletonView} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const SkeletonView = createClipsComponent(
  'ui-skeleton-view',
  function SkeletonView({
    children,
    padding,
    paddingInlineStart,
    paddingInlineEnd,
    paddingBlockStart,
    paddingBlockEnd,
  }) {
    return (
      <UiSkeletonView
        padding={padding}
        paddingInlineStart={paddingInlineStart}
        paddingInlineEnd={paddingInlineEnd}
        paddingBlockStart={paddingBlockStart}
        paddingBlockEnd={paddingBlockEnd}
      >
        {children}
      </UiSkeletonView>
    );
  },
);
