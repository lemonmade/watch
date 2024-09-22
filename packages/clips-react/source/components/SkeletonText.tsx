import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';
import type {
  SkeletonText as SkeletonTextElement,
  SkeletonTextProperties,
} from '@watching/clips/elements';

import {useCustomElementProperties} from './shared.ts';

export interface SkeletonTextProps
  extends PropsWithChildren<Omit<Partial<SkeletonTextProperties>, 'emphasis'>> {
  ref?: ForwardedRef<SkeletonTextElement>;
  emphasis?: SkeletonTextProperties['emphasis'] | boolean;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-skeleton-text': SkeletonTextProps;
    }
  }
}

export const SkeletonText = forwardRef<SkeletonTextElement, SkeletonTextProps>(
  function SkeletonText(props, ref) {
    const wrapperRef = useCustomElementProperties(props, ref);
    return <ui-skeleton-text {...props} ref={wrapperRef} />;
  },
);
