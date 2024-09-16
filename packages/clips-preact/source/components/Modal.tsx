import type {RenderableProps} from 'preact';

import type {
  Modal as ModalElement,
  ModalProperties,
} from '@watching/clips/elements';

export interface ModalProps
  extends RenderableProps<
    Omit<Partial<ModalProperties>, 'padding'>,
    ModalElement
  > {
  padding?: ModalProperties['padding'] | boolean;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-modal': ModalProps;
    }
  }
}

export function Modal(props: ModalProps) {
  return <ui-modal {...props} />;
}
