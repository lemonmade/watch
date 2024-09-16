import {
  TEXT_EMPHASIS_KEYWORDS,
  type TextEmphasisKeyword,
  SKELETON_TEXT_SIZE_KEYWORDS,
  type SkeletonTextSizeKeyword,
} from '@watching/design';
import type {CSSLiteralValue} from '../../styles.ts';

import {
  ClipsElement,
  backedByAttribute,
  restrictToAllowedValues,
} from '../ClipsElement.ts';

export interface SkeletonTextAttributes {
  /**
   * Custom emphasis values for the skeleton text element.
   */
  emphasis?: TextEmphasisKeyword;

  /**
   * The size of the skeleton text.
   */
  size?: SkeletonTextSizeKeyword | CSSLiteralValue;
}

export interface SkeletonTextProperties {
  /**
   * Custom emphasis values for the skeleton text element.
   *
   * @default 'auto'
   */
  emphasis: TextEmphasisKeyword;

  /**
   * The size of the skeleton text.
   *
   * @default 'auto'
   */
  size: SkeletonTextSizeKeyword | CSSLiteralValue;
}

export interface SkeletonTextEvents {}

/**
 * Text is used to visually style and provide semantic value for a small piece of text
 * content.
 */
export class SkeletonText
  extends ClipsElement<SkeletonTextAttributes, SkeletonTextEvents>
  implements SkeletonTextProperties
{
  static get remoteAttributes() {
    return ['emphasis', 'size'] satisfies (keyof SkeletonTextAttributes)[];
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

  /**
   * The size of the skeleton text.
   *
   * @default 'auto'
   */
  @backedByAttribute<SkeletonTextSizeKeyword | CSSLiteralValue>({
    parse(value) {
      return value?.startsWith('css:')
        ? (value as CSSLiteralValue)
        : restrictToAllowedValues(value, SKELETON_TEXT_SIZE_KEYWORDS);
    },
    serialize(value, context) {
      return value?.startsWith('css:')
        ? value
        : restrictToAllowedValues(value, SKELETON_TEXT_SIZE_KEYWORDS) ??
            context.current;
    },
  })
  accessor size: SkeletonTextSizeKeyword | CSSLiteralValue = 'auto';
}

customElements.define('ui-skeleton-text', SkeletonText);

declare global {
  interface HTMLElementTagNameMap {
    'ui-skeleton-text': InstanceType<typeof SkeletonText>;
  }
}
