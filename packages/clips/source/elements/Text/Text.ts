import {ClipsElement, restrictToAllowedValues} from '../ClipsElement.ts';

export type TextEmphasis = 'strong' | 'auto' | 'subdued';

export interface TextAttributes {
  emphasis?: TextEmphasis;
}

export interface TextEvents {}

const ALLOWED_EMPHASIS_VALUES = new Set<TextEmphasis>([
  'strong',
  'auto',
  'subdued',
]);

/**
 * Text is used to visually style and provide semantic value for a small piece of text
 * content.
 */
export class Text extends ClipsElement<TextAttributes, TextEvents> {
  static get remoteAttributes() {
    return ['emphasis'];
  }

  /**
   * Custom emphasis values for the text element. In addition to the `TextEmphasis`
   * values you can use when setting the `emphasis` attribute, you can also set this
   * property to `true` as an alias for `'strong'`. This property is reflected to the
   * `emphasis` attribute.
   */
  get emphasis(): TextEmphasis | undefined {
    return restrictToAllowedValues(
      this.getAttribute('emphasis'),
      ALLOWED_EMPHASIS_VALUES,
    );
  }

  set emphasis(value: TextEmphasis | boolean) {
    switch (value) {
      case true:
        this.setAttribute('emphasis', 'strong');
        break;
      case false:
        this.removeAttribute('emphasis');
        break;
      default:
        this.setAttribute('emphasis', value);
        break;
    }
  }
}

customElements.define('ui-text', Text);

declare global {
  interface HTMLElementTagNameMap {
    'ui-text': InstanceType<typeof Text>;
  }
}
