import {createRemoteComponent} from '@remote-ui/core';

export interface ActionProps {
  /**
   * Disallows interaction with the action.
   */
  disabled?: boolean;

  /**
   * A URL to open when the action is clicked.
   */
  to?: string;

  /**
   * A callback that is run when the action is pressed.
   */
  onPress?(): void | Promise<void>;
}

/**
 * Actions are the primary component used to allow user action.
 */
export const Action = createRemoteComponent<'Action', ActionProps>('Action');
