import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';
import type {
  SkeletonButton as SkeletonButtonElement,
  SkeletonButtonProperties,
} from '@watching/clips/elements';

import {useCustomElementProperties} from './shared.ts';

export interface SkeletonButtonProps
  extends PropsWithChildren<Partial<SkeletonButtonProperties>> {
  ref?: ForwardedRef<SkeletonButtonElement>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-skeleton-button': SkeletonButtonProps;
    }
  }
}

export const SkeletonButton = forwardRef<
  SkeletonButtonElement,
  SkeletonButtonProps
>(function SkeletonButton(props, ref) {
  const wrapperRef = useCustomElementProperties(props, ref);
  return <ui-skeleton-button {...props} ref={wrapperRef} />;
});
