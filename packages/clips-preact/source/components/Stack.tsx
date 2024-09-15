import type {RenderableProps} from 'preact';

import type {
  Stack as StackElement,
  StackProperties,
} from '@watching/clips/elements';
import {ViewProps} from './View';

export interface StackProps
  extends Omit<Partial<StackProperties>, 'spacing' | keyof ViewProps>,
    ViewProps {
  spacing?: StackProperties['spacing'] | boolean;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-stack': RenderableProps<StackProps, StackElement>;
    }
  }
}

export function Stack(props: RenderableProps<StackProps, StackElement>) {
  return <ui-stack {...props} />;
}
