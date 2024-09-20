import type {RenderableProps} from 'preact';

import type {
  SkeletonTextBlock as SkeletonTextBlockElement,
  SkeletonTextBlockProperties,
} from '@watching/clips/elements';

export interface SkeletonTextBlockProps
  extends RenderableProps<
    Partial<SkeletonTextBlockProperties>,
    SkeletonTextBlockElement
  > {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-skeleton-text-block': SkeletonTextBlockProps;
    }
  }
}

export function SkeletonTextBlock(props: SkeletonTextBlockProps) {
  return <ui-skeleton-text-block {...props} />;
}
