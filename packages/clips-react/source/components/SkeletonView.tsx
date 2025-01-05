import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';
import type {
  SkeletonView as SkeletonViewElement,
  SkeletonViewProperties,
} from '@watching/clips/elements';

import {useCustomElementProperties} from './shared.ts';

export interface SkeletonViewProps
  extends PropsWithChildren<Partial<SkeletonViewProperties>> {
  ref?: ForwardedRef<SkeletonViewElement>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-skeleton-view': SkeletonViewProps;
    }
  }
}

export const SkeletonView = forwardRef<SkeletonViewElement, SkeletonViewProps>(
  function SkeletonView(props, ref) {
    const wrapperRef = useCustomElementProperties(props, ref);
    return <ui-skeleton-view ref={wrapperRef} />;
  },
);
