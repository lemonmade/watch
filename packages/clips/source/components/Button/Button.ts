import {createRemoteComponent} from '@remote-ui/core';

export interface ButtonProps {
  /**
   * Disallows interaction with the button.
   */
  disabled?: boolean;

  /**
   * A URL to open when the button is clicked.
   */
  to?: string;

  /**
   * A callback that is run when the button is pressed.
   */
  onPress?(): Promise<void>;
}

/**
 * Buttons are the primary component used to allow user action.
 */
export const Button = createRemoteComponent<'Button', ButtonProps>('Button');
