import type {
  RemoteEvent,
  RemoteElementEventListenersDefinition,
} from '@remote-dom/core/elements';

import {
  ClipsElement,
  backedByAttribute,
  backedByAttributeAsBoolean,
} from '../ClipsElement.ts';

export interface ActionAttributes {
  /**
   * A URL to open when the action is clicked.
   */
  to?: string;

  /**
   * Disallows interaction with the action.
   */
  disabled?: '';
}

export interface ActionProperties {
  /**
   * A URL to open when the action is clicked.
   */
  to?: string;

  /**
   * Disallows interaction with the action.
   */
  disabled: boolean;
}

export interface ActionEvents {
  /**
   * A callback that is run when the action is pressed.
   */
  press: RemoteEvent<void>;
}

/**
 * Actions are the primary component used to allow user action.
 */
export class Action
  extends ClipsElement<ActionAttributes, ActionEvents>
  implements ActionProperties
{
  static get remoteEvents(): RemoteElementEventListenersDefinition<ActionEvents> {
    return {
      press: {
        bubbles: true,
      },
    };
  }

  static get remoteAttributes() {
    return ['to', 'disabled'] satisfies (keyof ActionAttributes)[];
  }

  @backedByAttribute()
  accessor to: string | undefined;

  @backedByAttributeAsBoolean()
  accessor disabled: boolean = false;
}

customElements.define('ui-action', Action);

declare global {
  interface HTMLElementTagNameMap {
    'ui-action': InstanceType<typeof Action>;
  }
}
