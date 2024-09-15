import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  Action as ActionElement,
  ActionProperties,
  ActionEvents,
} from '@watching/clips/elements';

export interface ActionProps
  extends PropsWithChildren<Partial<ActionProperties>> {
  ref?: ForwardedRef<ActionElement>;
  onPress?(): void | Promise<void>;
  onpress?(event: ActionEvents['press']): void;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-action': Omit<ActionProps, 'onPress'>;
    }
  }
}

export const Action = forwardRef<ActionElement, ActionProps>(function Action(
  {onPress, ...props},
  ref,
) {
  return (
    <ui-action
      ref={ref}
      {...props}
      onpress={onPress ? (event) => event.respondWith(onPress()) : undefined}
    />
  );
});
