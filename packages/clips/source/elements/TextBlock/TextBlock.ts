import {ClipsElement} from '../ClipsElement.ts';

export interface TextBlockAttributes {}

export interface TextBlockProperties {}

export interface TextBlockEvents {}

/**
 * TextBlock wraps a block of text content.
 */
export class TextBlock
  extends ClipsElement<TextBlockAttributes, TextBlockEvents>
  implements TextBlockProperties
{
  static get remoteAttributes() {
    return [] satisfies (keyof TextBlockAttributes)[];
  }
}

customElements.define('ui-text-block', TextBlock);

declare global {
  interface HTMLElementTagNameMap {
    'ui-text-block': InstanceType<typeof TextBlock>;
  }
}
