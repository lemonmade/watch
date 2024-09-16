import {ClipsElement, backedByAttribute} from '../ClipsElement.ts';

export interface DisclosureAttributes {
  /**
   * The content to use for the activator button.
   */
  label?: string;
}

export interface DisclosureProperties {
  /**
   * The content to use for the activator button.
   */
  label?: string;
}

export interface DisclosureEvents {}

/**
 * A UI pattern where an activator button is used to hide and show
 * details content. This component accepts a `label` slot for the
 * content of the activator.
 */
export class Disclosure
  extends ClipsElement<DisclosureAttributes, DisclosureEvents>
  implements DisclosureProperties
{
  static get remoteAttributes() {
    return ['label'] satisfies (keyof DisclosureAttributes)[];
  }

  @backedByAttribute()
  accessor label: string | undefined;
}

customElements.define('ui-disclosure', Disclosure);

declare global {
  interface HTMLElementTagNameMap {
    'ui-disclosure': InstanceType<typeof Disclosure>;
  }
}
