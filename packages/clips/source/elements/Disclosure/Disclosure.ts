import {createRemoteElement} from '@lemonmade/remote-ui/elements';

export interface DisclosureProperties {
  label?: string;
}

export interface DisclosureSlots {
  /**
   * The content to use for the activator button.
   */
  label?: true;
}

/**
 * A UI pattern where an activator button is used to hide and show
 * details content. This component accepts a `label` slot for the
 * content of the activator.
 */
export const Disclosure = createRemoteElement<
  DisclosureProperties,
  DisclosureSlots
>({
  properties: {label: {type: String}},
  slots: ['label'],
});

customElements.define('ui-disclosure', Disclosure);

declare global {
  interface HTMLElementTagNameMap {
    'ui-disclosure': InstanceType<typeof Disclosure>;
  }
}
