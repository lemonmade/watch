import {
  forwardRef,
  isValidElement,
  cloneElement,
  type ReactNode,
  type PropsWithChildren,
  type ForwardedRef,
} from 'react';

import type {
  Button as ButtonElement,
  ButtonProperties,
  ButtonEvents,
} from '@watching/clips/elements';

import {useCustomElementProperties} from './shared.ts';

export interface ButtonProps
  extends PropsWithChildren<Partial<ButtonProperties>> {
  ref?: ForwardedRef<ButtonElement>;
  overlay?: ReactNode;
  onPress?(): void | Promise<void>;
  onpress?(event: ButtonEvents['press']): void;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-button': Omit<ButtonProps, 'onPress' | 'overlay'>;
    }
  }
}

export const Button = forwardRef<ButtonElement, ButtonProps>(function Button(
  {overlay, children, onPress, ...props},
  ref,
) {
  const allProps: ButtonProps = {
    onpress: onPress ? (event) => event.respondWith(onPress()) : undefined,
    ...props,
  };

  const wrapperRef = useCustomElementProperties(allProps, ref);

  return (
    <ui-button {...allProps} ref={wrapperRef}>
      {children}
      {overlay && isValidElement(overlay)
        ? cloneElement<any>(overlay, {slot: 'overlay'})
        : null}
    </ui-button>
  );
});
