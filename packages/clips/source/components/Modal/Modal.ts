import {createRemoteComponent} from '@remote-ui/core';

export interface ModalProps {
  /**
   * Whether to add padding on the inside of the modal.
   *
   * @default false
   */
  padding?: boolean;
}

/**
 * A Modal is an overlay that blocks interaction with the rest of the page. The
 * user must take an action to dismiss the modal, either by pressing on the backdrop,
 * or by pressing an action in the modal that closes it.
 *
 * You should only pass a Modal as the `overlay` prop on action components. Modals
 * passed to this prop will be automatically opened when the action is pressed, and
 * the action will be given accessibility markup that associates it with the modal.
 */
export const Modal = createRemoteComponent<'Modal', ModalProps>('Modal');
