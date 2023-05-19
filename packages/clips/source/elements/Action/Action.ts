import {createRemoteElement} from '@lemonmade/remote-ui/elements';

import {type SignalOrValue} from '../../signals.ts';

export interface ActionProperties {
  /**
   * A URL to open when the action is clicked.
   */
  to?: string;

  /**
   * Disallows interaction with the action.
   */
  disabled?: SignalOrValue<boolean>;

  /**
   * A callback that is run when the action is pressed.
   */
  onPress?(): void | Promise<void>;
}

export interface ActionSlots {
  /**
   * An overlay component to render when this button is pressed. Typically,
   * you will render either a `Popover` or a `Modal` here.
   */
  overlay?: true;
}

/**
 * Actions are the primary component used to allow user action.
 */
export const Action = createRemoteElement<ActionProperties, ActionSlots>({
  slots: ['overlay'],
  properties: {
    to: {type: String},
    disabled: {type: Boolean},
    onPress: {type: Function},
  },
});

customElements.define('ui-action', Action);

declare global {
  interface HTMLElementTagNameMap {
    'ui-action': InstanceType<typeof Action>;
  }
}
