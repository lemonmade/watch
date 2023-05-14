import {Modal as UiModal} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const Modal = createClipsComponent(
  'ui-modal',
  function Modal({children, padding}) {
    return <UiModal padding={padding}>{children}</UiModal>;
  },
);
