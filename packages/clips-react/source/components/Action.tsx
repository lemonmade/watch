import {
  forwardRef,
  isValidElement,
  cloneElement,
  type ReactNode,
  type PropsWithChildren,
  type ForwardedRef,
} from 'react';

import type {
  Action as ActionElement,
  ActionProperties,
  ActionEvents,
} from '@watching/clips/elements';

export interface ActionProps
  extends PropsWithChildren<Partial<ActionProperties>> {
  ref?: ForwardedRef<ActionElement>;
  overlay?: ReactNode;
  onPress?(): void | Promise<void>;
  onpress?(event: ActionEvents['press']): void;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-action': Omit<ActionProps, 'onPress' | 'overlay'>;
    }
  }
}

export const Action = forwardRef<ActionElement, ActionProps>(function Action(
  {overlay, children, onPress, ...props},
  ref,
) {
  return (
    <ui-action
      ref={ref}
      {...props}
      onpress={onPress ? (event) => event.respondWith(onPress()) : undefined}
    >
      {children}
      {overlay && isValidElement(overlay)
        ? cloneElement<any>(overlay, {slot: 'overlay'})
        : null}
    </ui-action>
  );
});
