import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  Image as ImageElement,
  ImageProperties,
} from '@watching/clips/elements';

import {useCustomElementProperties} from './shared.ts';

export interface ImageProps
  extends PropsWithChildren<Omit<Partial<ImageProperties>, 'cornerRadius'>> {
  ref?: ForwardedRef<ImageElement>;
  cornerRadius?: ImageProperties['cornerRadius'] | boolean;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-image': ImageProps;
    }
  }
}

export const Image = forwardRef<ImageElement, ImageProps>(
  function Image(props, ref) {
    const wrapperRef = useCustomElementProperties(props, ref);
    return <ui-image {...props} ref={wrapperRef} />;
  },
);
