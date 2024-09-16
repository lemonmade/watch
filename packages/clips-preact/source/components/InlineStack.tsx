import type {RenderableProps} from 'preact';

import type {
  InlineStack as InlineStackElement,
  InlineStackProperties,
} from '@watching/clips/elements';

import type {StackProps} from './Stack.tsx';

export interface InlineStackProps
  extends RenderableProps<
      Omit<Partial<InlineStackProperties>, keyof StackProps>,
      InlineStackElement
    >,
    Omit<StackProps, 'ref' | 'direction'> {}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-inline-stack': InlineStackProps;
    }
  }
}

export function InlineStack(props: InlineStackProps) {
  return <ui-inline-stack {...props} />;
}
