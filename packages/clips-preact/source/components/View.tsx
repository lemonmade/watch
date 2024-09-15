import type {RenderableProps} from 'preact';

import type {
  View as ViewElement,
  ViewProperties,
} from '@watching/clips/elements';

export interface ViewProps
  extends Omit<
    Partial<ViewProperties>,
    | 'padding'
    | 'paddingInlineStart'
    | 'paddingInlineEnd'
    | 'paddingBlockStart'
    | 'paddingBlockEnd'
  > {
  padding?: ViewProperties['padding'] | boolean;
  paddingInlineStart?: ViewProperties['paddingInlineStart'] | boolean;
  paddingInlineEnd?: ViewProperties['paddingInlineEnd'] | boolean;
  paddingBlockStart?: ViewProperties['paddingBlockStart'] | boolean;
  paddingBlockEnd?: ViewProperties['paddingBlockEnd'] | boolean;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-view': RenderableProps<ViewProps, ViewElement>;
    }
  }
}

export function View(props: RenderableProps<ViewProps, ViewElement>) {
  return <ui-view {...props} />;
}
