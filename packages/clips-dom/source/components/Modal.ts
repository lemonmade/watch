import {Modal as BaseModal} from '@watching/clips';

import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared.ts';

export const Modal = 'ui-modal';

export const ModalComponent = createRemoteDOMComponent(BaseModal, {
  properties: ['padding'],
});

export type UIModalElement = HTMLElementForRemoteComponent<typeof BaseModal>;
