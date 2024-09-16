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

import {useCustomElementProperties} from './shared.ts';

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
  const allProps: ActionProps = {
    onpress: onPress ? (event) => event.respondWith(onPress()) : undefined,
    ...props,
  };

  const wrapperRef = useCustomElementProperties(allProps, ref);

  return (
    <ui-action {...allProps} ref={wrapperRef}>
      {children}
      {overlay && isValidElement(overlay)
        ? cloneElement<any>(overlay, {slot: 'overlay'})
        : null}
    </ui-action>
  );
});
