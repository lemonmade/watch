import type {RenderableProps} from 'preact';

import type {
  Heading as HeadingElement,
  HeadingProperties,
} from '@watching/clips/elements';

export interface HeadingProps
  extends RenderableProps<
    Omit<Partial<HeadingProperties>, 'level'>,
    HeadingElement
  > {
  level?:
    | HeadingProperties['level']
    | `${NonNullable<HeadingProperties['level']>}`
    | 'auto';
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-heading': HeadingProps;
    }
  }
}

export function Heading(props: HeadingProps) {
  return <ui-heading {...props} />;
}
