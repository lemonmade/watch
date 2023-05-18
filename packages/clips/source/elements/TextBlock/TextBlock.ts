import {createRemoteElement} from '@lemonmade/remote-ui/elements';

export interface TextBlockProperties {}

/**
 * TextBlock wraps a block of text content.
 */
export const TextBlock = createRemoteElement<TextBlockProperties>({
  properties: {},
});

customElements.define('ui-text-block', TextBlock);

declare global {
  interface HTMLElementTagNameMap {
    'ui-text-block': InstanceType<typeof TextBlock>;
  }
}
