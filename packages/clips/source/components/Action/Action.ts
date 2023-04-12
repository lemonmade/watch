import {createRemoteComponent, type RemoteFragment} from '@remote-ui/core';

import {type SignalOrValue} from '../../signals.ts';

export interface ActionProps {
  /**
   * Disallows interaction with the action.
   */
  disabled?: SignalOrValue<boolean>;

  /**
   * A URL to open when the action is clicked.
   */
  to?: string;

  /**
   * A callback that is run when the action is pressed.
   */
  onPress?(): void | Promise<void>;

  /**
   * An overlay component to render when this button is pressed. Typically,
   * you will render either a `Popover` or a `Modal` here.
   */
  overlay?: RemoteFragment<any>;
}

/**
 * Actions are the primary component used to allow user action.
 */
export const Action = createRemoteComponent<'Action', ActionProps>('Action');
