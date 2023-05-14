import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {Modal as ModalName, ModalElement} from '@watching/clips';

export const Modal = createRemoteComponent(ModalElement, {
  element: ModalName,
});
