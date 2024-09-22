import type {RenderableProps} from 'preact';

import type {
  SkeletonText as SkeletonTextElement,
  SkeletonTextProperties,
} from '@watching/clips/elements';

export interface SkeletonTextProps
  extends RenderableProps<
    Omit<Partial<SkeletonTextProperties>, 'emphasis'>,
    SkeletonTextElement
  > {
  emphasis?: SkeletonTextProperties['emphasis'] | boolean;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-skeleton-text': SkeletonTextProps;
    }
  }
}

export function SkeletonText(props: SkeletonTextProps) {
  return <ui-skeleton-text {...props} />;
}
