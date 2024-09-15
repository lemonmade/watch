import type {RenderableProps} from 'preact';

import type {
  Stack as StackElement,
  StackProperties,
} from '@watching/clips/elements';

import {ViewProps} from './View.tsx';

export interface StackProps
  extends RenderableProps<
      Omit<Partial<StackProperties>, 'spacing' | keyof ViewProps>,
      StackElement
    >,
    Omit<ViewProps, 'ref'> {
  spacing?: StackProperties['spacing'] | boolean;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-stack': StackProps;
    }
  }
}

export function Stack(props: StackProps) {
  return <ui-stack {...props} />;
}
