import {Modal as BaseModal} from '@watching/clips';
import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared';

export const Modal = 'ui-modal';

export const ModalComponent = createRemoteDOMComponent(BaseModal, {
  properties: ['padding'],
});

export type UIModalElement = HTMLElementForRemoteComponent<typeof BaseModal>;
