import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  View as ViewElement,
  ViewProperties,
} from '@watching/clips/elements';

import {useCustomElementProperties} from './shared.ts';

export interface ViewProps
  extends PropsWithChildren<
    Omit<
      Partial<ViewProperties>,
      | 'padding'
      | 'paddingInlineStart'
      | 'paddingInlineEnd'
      | 'paddingBlockStart'
      | 'paddingBlockEnd'
    >
  > {
  ref?: ForwardedRef<ViewElement>;
  padding?: ViewProperties['padding'] | boolean;
  paddingInlineStart?: ViewProperties['paddingInlineStart'] | boolean;
  paddingInlineEnd?: ViewProperties['paddingInlineEnd'] | boolean;
  paddingBlockStart?: ViewProperties['paddingBlockStart'] | boolean;
  paddingBlockEnd?: ViewProperties['paddingBlockEnd'] | boolean;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-view': ViewProps;
    }
  }
}

export const View = forwardRef<ViewElement, ViewProps>(
  function View(props, ref) {
    useCustomElementProperties(props, ref);
    return <ui-view {...props} ref={ref} />;
  },
);
