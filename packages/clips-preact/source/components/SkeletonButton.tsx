import type {RenderableProps} from 'preact';

import type {
  SkeletonButton as SkeletonButtonElement,
  SkeletonButtonProperties,
} from '@watching/clips/elements';

export interface SkeletonButtonProps
  extends RenderableProps<
    Partial<SkeletonButtonProperties>,
    SkeletonButtonElement
  > {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-skeleton-button': SkeletonButtonProps;
    }
  }
}

export function SkeletonButton(props: SkeletonButtonProps) {
  return <ui-skeleton-button {...props} />;
}
