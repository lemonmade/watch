import {SkeletonView as UISKeletonView} from '@lemon/zest';
import {createClipsComponentRenderer, useRenderedChildren} from './shared.ts';
import {useViewProps} from './View.tsx';

export const SkeletonView = createClipsComponentRenderer(
  'ui-skeleton-view',
  function SkeletonView(props) {
    const {children} = useRenderedChildren(props);

    return <UISKeletonView {...useViewProps(props)}>{children}</UISKeletonView>;
  },
);
