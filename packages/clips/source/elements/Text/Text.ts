import {
  TEXT_EMPHASIS_KEYWORDS,
  type TextEmphasisKeyword,
} from '@watching/design';

import {
  ClipsElement,
  backedByAttributeWithBooleanShorthand,
  attributeRestrictedToAllowedValues,
} from '../ClipsElement.ts';

export interface TextAttributes {
  /**
   * Custom emphasis values for the text element.
   */
  emphasis?: TextEmphasisKeyword;
}

export interface TextProperties {
  /**
   * Custom emphasis values for the text element.
   *
   * @default 'auto'
   */
  emphasis: TextEmphasisKeyword;
}

export interface TextEvents {}

/**
 * Text is used to visually style and provide semantic value for a small piece of text
 * content.
 */
export class Text
  extends ClipsElement<TextAttributes, TextEvents>
  implements TextProperties
{
  static get remoteAttributes() {
    return ['emphasis'];
  }

  /**
   * Custom emphasis values for the text element. In addition to the `TextEmphasis`
   * values you can use when setting the `emphasis` attribute, you can also set this
   * property to `true` as an alias for `'strong'`. This property is reflected to the
   * `emphasis` attribute.
   *
   * @default 'auto'
   */
  @backedByAttributeWithBooleanShorthand<TextEmphasisKeyword>({
    whenTrue: 'strong',
    ...attributeRestrictedToAllowedValues(TEXT_EMPHASIS_KEYWORDS),
  })
  accessor emphasis: TextEmphasisKeyword = 'auto';
}

customElements.define('ui-text', Text);

declare global {
  interface HTMLElementTagNameMap {
    'ui-text': InstanceType<typeof Text>;
  }
}
