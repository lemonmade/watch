import {forwardRef, type PropsWithChildren, type ForwardedRef} from 'react';

import type {
  Modal as ModalElement,
  ModalProperties,
} from '@watching/clips/elements';

import {useCustomElementProperties} from './shared.ts';

export interface ModalProps
  extends PropsWithChildren<Omit<Partial<ModalProperties>, 'padding'>> {
  ref?: ForwardedRef<ModalElement>;
  padding?: ModalProperties['padding'] | boolean;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-modal': ModalProps;
    }
  }
}

export const Modal = forwardRef<ModalElement, ModalProps>(
  function Modal(props, ref) {
    useCustomElementProperties(props, ref);
    return <ui-modal {...props} ref={ref} />;
  },
);
