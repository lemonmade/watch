import type {RenderableProps} from 'preact';

import type {
  Image as ImageElement,
  ImageProperties,
} from '@watching/clips/elements';

export interface ImageProps
  extends RenderableProps<
    Omit<Partial<ImageProperties>, 'cornerRadius'>,
    ImageElement
  > {
  cornerRadius?: ImageProperties['cornerRadius'] | boolean;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-image': ImageProps;
    }
  }
}

export function Image(props: ImageProps) {
  return <ui-image {...props} />;
}
