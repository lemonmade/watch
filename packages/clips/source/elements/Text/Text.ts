import {
  TEXT_EMPHASIS_KEYWORDS,
  type TextEmphasisKeyword,
} from '@watching/design';

import {ClipsElement, restrictToAllowedValues} from '../ClipsElement.ts';

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
    return ['emphasis'] satisfies (keyof TextAttributes)[];
  }

  /**
   * Custom emphasis values for the text element. In addition to the `TextEmphasis`
   * values you can use when setting the `emphasis` attribute, you can also set this
   * property to `true` as an alias for `'strong'`. This property is reflected to the
   * `emphasis` attribute.
   *
   * @default 'auto'
   */
  get emphasis(): TextEmphasisKeyword {
    return (
      restrictToAllowedValues(
        this.getAttribute('emphasis'),
        TEXT_EMPHASIS_KEYWORDS,
      ) ?? 'auto'
    );
  }

  set emphasis(value: TextEmphasisKeyword | boolean | undefined) {
    if (value == null || value === false) {
      this.removeAttribute('emphasis');
    } else {
      const resolvedValue =
        value === true
          ? 'strong'
          : restrictToAllowedValues(value, TEXT_EMPHASIS_KEYWORDS);

      if (resolvedValue) this.setAttribute('emphasis', resolvedValue);
    }
  }
}

customElements.define('ui-text', Text);

declare global {
  interface HTMLElementTagNameMap {
    'ui-text': InstanceType<typeof Text>;
  }
}
