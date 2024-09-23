import type {ButtonAction} from '@watching/design';
import type {
  RemoteEvent,
  RemoteElementEventListenersDefinition,
} from '@remote-dom/core/elements';

import {
  ClipsElement,
  backedByAttribute,
  backedByAttributeAsBoolean,
} from '../ClipsElement.ts';

export interface ButtonAttributes {
  /**
   * A URL to open when the button is clicked.
   */
  to?: string;

  /**
   * Disallows interaction with the button.
   */
  disabled?: '';

  /**
   * An action to perform when the button is pressed.
   */
  action?: ButtonAction;
}

export interface ButtonProperties {
  /**
   * A URL to open when the button is clicked.
   */
  to?: string;

  /**
   * Disallows interbutton with the button.
   */
  disabled: boolean;
}

export interface ButtonEvents {
  /**
   * A callback that is run when the button is pressed.
   */
  press: RemoteEvent<void>;
}

/**
 * Buttons are the primary component used to allow user button.
 */
export class Button
  extends ClipsElement<ButtonAttributes, ButtonEvents>
  implements ButtonProperties
{
  static get remoteEvents(): RemoteElementEventListenersDefinition<ButtonEvents> {
    return {
      press: {
        bubbles: true,
      },
    };
  }

  static get remoteAttributes() {
    return ['action', 'to', 'disabled'] satisfies (keyof ButtonAttributes)[];
  }

  @backedByAttribute()
  accessor to: string | undefined;

  @backedByAttributeAsBoolean()
  accessor disabled: boolean = false;

  @backedByAttribute()
  accessor action: ButtonAction | undefined;
}

customElements.define('ui-button', Button);

declare global {
  interface HTMLElementTagNameMap {
    'ui-button': InstanceType<typeof Button>;
  }
}
