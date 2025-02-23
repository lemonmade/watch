import {
  SKELETON_BUTTON_SIZE_KEYWORDS,
  type SkeletonButtonSizeKeyword,
} from '@watching/design';
import type {CSSLiteralValue} from '../../styles.ts';

import {
  ClipsElement,
  backedByAttribute,
  restrictToAllowedValues,
} from '../ClipsElement.ts';

export interface SkeletonButtonAttributes {
  /**
   * The size of the skeleton text.
   */
  size?: SkeletonButtonSizeKeyword | CSSLiteralValue;
}

export interface SkeletonButtonProperties {
  /**
   * The size of the skeleton text.
   *
   * @default 'auto'
   */
  size: SkeletonButtonSizeKeyword | CSSLiteralValue;
}

export interface SkeletonButtonEvents {}

/**
 * Text is used to visually style and provide semantic value for a small piece of text
 * content.
 */
export class SkeletonButton
  extends ClipsElement<SkeletonButtonAttributes, SkeletonButtonEvents>
  implements SkeletonButtonProperties
{
  static get remoteAttributes() {
    return ['size'] satisfies (keyof SkeletonButtonAttributes)[];
  }

  /**
   * The size of the skeleton text.
   *
   * @default 'auto'
   */
  @backedByAttribute<SkeletonButtonSizeKeyword | CSSLiteralValue>({
    parse(value) {
      return value?.startsWith('css:')
        ? (value as CSSLiteralValue)
        : restrictToAllowedValues(value, SKELETON_BUTTON_SIZE_KEYWORDS);
    },
    serialize(value, context) {
      return value?.startsWith('css:')
        ? value
        : (restrictToAllowedValues(value, SKELETON_BUTTON_SIZE_KEYWORDS) ??
            context.current);
    },
  })
  accessor size: SkeletonButtonSizeKeyword | CSSLiteralValue = 'auto';
}

customElements.define('ui-skeleton-button', SkeletonButton);

declare global {
  interface HTMLElementTagNameMap {
    'ui-skeleton-button': InstanceType<typeof SkeletonButton>;
  }
}
