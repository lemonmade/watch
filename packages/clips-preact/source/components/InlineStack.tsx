import type {RenderableProps} from 'preact';

import type {
  InlineStack as InlineStackElement,
  InlineStackProperties,
} from '@watching/clips/elements';

import type {StackProps} from './Stack.tsx';

export interface InlineStackProps
  extends Omit<Partial<InlineStackProperties>, keyof StackProps>,
    Omit<StackProps, 'direction'> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-inline-stack': RenderableProps<InlineStackProps, InlineStackElement>;
    }
  }
}

export function InlineStack(
  props: RenderableProps<InlineStackProps, InlineStackElement>,
) {
  return <ui-inline-stack {...props} />;
}
