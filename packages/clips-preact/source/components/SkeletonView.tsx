import type {RenderableProps} from 'preact';

import type {
  SkeletonView as SkeletonViewElement,
  SkeletonViewProperties,
} from '@watching/clips/elements';

export interface SkeletonViewProps
  extends RenderableProps<
    Partial<SkeletonViewProperties>,
    SkeletonViewElement
  > {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-skeleton-view': SkeletonViewProps;
    }
  }
}

export function SkeletonView(props: SkeletonViewProps) {
  return <ui-skeleton-view {...props} />;
}
