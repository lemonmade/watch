import {type Modal as BaseModal} from '@watching/clips';
import {type HTMLElementForRemoteComponent} from './shared';

export const Modal = 'ui-modal';
export type UIModalElement = HTMLElementForRemoteComponent<typeof BaseModal>;
