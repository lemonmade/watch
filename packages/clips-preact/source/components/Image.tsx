import type {RenderableProps} from 'preact';

import type {
  Image as ImageElement,
  ImageProperties,
} from '@watching/clips/elements';

export interface ImageProps
  extends Omit<Partial<ImageProperties>, 'cornerRadius'> {
  cornerRadius?: ImageProperties['cornerRadius'] | boolean;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-image': RenderableProps<ImageProps, ImageElement>;
    }
  }
}

export function Image(props: RenderableProps<ImageProps, ImageElement>) {
  return <ui-image {...props} />;
}
