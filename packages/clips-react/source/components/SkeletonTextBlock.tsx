import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';
import type {
  SkeletonTextBlock as SkeletonTextBlockElement,
  SkeletonTextBlockProperties,
} from '@watching/clips/elements';

import {useCustomElementProperties} from './shared.ts';

export interface SkeletonTextBlockProps
  extends PropsWithChildren<Partial<SkeletonTextBlockProperties>> {
  ref?: ForwardedRef<SkeletonTextBlockElement>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-skeleton-text-block': SkeletonTextBlockProps;
    }
  }
}

export const SkeletonTextBlock = forwardRef<
  SkeletonTextBlockElement,
  SkeletonTextBlockProps
>(function SkeletonTextBlock(props, ref) {
  const wrapperRef = useCustomElementProperties(props, ref);
  return <ui-skeleton-text-block ref={wrapperRef} />;
});
