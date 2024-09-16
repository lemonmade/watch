import {
  cloneElement,
  isValidElement,
  type RenderableProps,
  type VNode,
} from 'preact';

import type {
  Action as ActionElement,
  ActionProperties,
  ActionEvents,
} from '@watching/clips/elements';

export interface ActionProps
  extends RenderableProps<Partial<ActionProperties>, ActionElement> {
  overlay?: VNode<any>;
  onPress?(): void | Promise<void>;
  onpress?(event: ActionEvents['press']): void;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-action': Omit<ActionProps, 'onPress' | 'overlay'>;
    }
  }
}

export function Action({overlay, children, onPress, ...props}: ActionProps) {
  return (
    <ui-action
      onpress={onPress ? (event) => event.respondWith(onPress()) : undefined}
      {...props}
    >
      {children}
      {overlay && isValidElement(overlay)
        ? cloneElement(overlay, {slot: 'overlay'})
        : null}
    </ui-action>
  );
}
