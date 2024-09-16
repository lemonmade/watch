import {
  SKELETON_ACTION_SIZE_KEYWORDS,
  type SkeletonActionSizeKeyword,
} from '@watching/design';
import type {CSSLiteralValue} from '../../styles.ts';

import {
  ClipsElement,
  backedByAttribute,
  restrictToAllowedValues,
} from '../ClipsElement.ts';

export interface SkeletonActionAttributes {
  /**
   * The size of the skeleton text.
   */
  size?: SkeletonActionSizeKeyword | CSSLiteralValue;
}

export interface SkeletonActionProperties {
  /**
   * The size of the skeleton text.
   *
   * @default 'auto'
   */
  size: SkeletonActionSizeKeyword | CSSLiteralValue;
}

export interface SkeletonActionEvents {}

/**
 * Text is used to visually style and provide semantic value for a small piece of text
 * content.
 */
export class SkeletonAction
  extends ClipsElement<SkeletonActionAttributes, SkeletonActionEvents>
  implements SkeletonActionProperties
{
  static get remoteAttributes() {
    return ['size'] satisfies (keyof SkeletonActionAttributes)[];
  }

  /**
   * The size of the skeleton text.
   *
   * @default 'auto'
   */
  @backedByAttribute<SkeletonActionSizeKeyword | CSSLiteralValue>({
    parse(value) {
      return value?.startsWith('css:')
        ? (value as CSSLiteralValue)
        : restrictToAllowedValues(value, SKELETON_ACTION_SIZE_KEYWORDS);
    },
    serialize(value, context) {
      return value?.startsWith('css:')
        ? value
        : restrictToAllowedValues(value, SKELETON_ACTION_SIZE_KEYWORDS) ??
            context.current;
    },
  })
  accessor size: SkeletonActionSizeKeyword | CSSLiteralValue = 'auto';
}

customElements.define('ui-skeleton-action', SkeletonAction);

declare global {
  interface HTMLElementTagNameMap {
    'ui-skeleton-action': InstanceType<typeof SkeletonAction>;
  }
}
