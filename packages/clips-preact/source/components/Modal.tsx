import type {RenderableProps} from 'preact';

import type {
  Modal as ModalElement,
  ModalProperties,
} from '@watching/clips/elements';

export interface ModalProps extends Omit<Partial<ModalProperties>, 'padding'> {
  padding?: ModalProperties['padding'] | boolean;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-modal': RenderableProps<ModalProps, ModalElement>;
    }
  }
}

export function Modal(props: RenderableProps<ModalProps, ModalElement>) {
  return <ui-modal {...props} />;
}
