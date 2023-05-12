import {createRemoteElement} from '@lemonmade/remote-ui/elements';

export interface TextBlockProperties {}

export const TextBlock = 'ui-text-block';

/**
 * TextBlock wraps a block of text content.
 */
export const TextBlockElement = createRemoteElement<TextBlockProperties>({
  properties: {},
});

customElements.define(TextBlock, TextBlockElement);

declare global {
  interface HTMLElementTagNameMap {
    [TextBlock]: InstanceType<typeof TextBlockElement>;
  }
}
