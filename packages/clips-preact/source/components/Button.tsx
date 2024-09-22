import {
  cloneElement,
  isValidElement,
  type RenderableProps,
  type VNode,
} from 'preact';

import type {
  Button as ButtonElement,
  ButtonProperties,
  ButtonEvents,
} from '@watching/clips/elements';

export interface ButtonProps
  extends RenderableProps<Partial<ButtonProperties>, ButtonElement> {
  overlay?: VNode<any>;
  onPress?(): void | Promise<void>;
  onpress?(event: ButtonEvents['press']): void;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-button': Omit<ButtonProps, 'onPress' | 'overlay'>;
    }
  }
}

export function Button({overlay, children, onPress, ...props}: ButtonProps) {
  return (
    <ui-button
      onpress={onPress ? (event) => event.respondWith(onPress()) : undefined}
      {...props}
    >
      {children}
      {overlay && isValidElement(overlay)
        ? cloneElement(overlay, {slot: 'overlay'})
        : null}
    </ui-button>
  );
}
