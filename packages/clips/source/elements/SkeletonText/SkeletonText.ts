import {
  createRemoteElement,
  BooleanOrString,
  type RemoteElementPropertyType,
} from '@remote-dom/core/elements';

import type {CSSLiteralValue} from '../../styles.ts';

import type {TextProperties} from '../Text.ts';

export interface SkeletonTextProperties
  extends Pick<TextProperties, 'emphasis'> {
  size?: 'small' | 'medium' | 'large' | CSSLiteralValue;
}

export const SkeletonText = createRemoteElement<SkeletonTextProperties>({
  properties: {
    emphasis: {
      type: BooleanOrString as RemoteElementPropertyType<
        SkeletonTextProperties['emphasis']
      >,
      default: false,
    },
    size: {
      type: String,
    },
  },
});

customElements.define('ui-skeleton-text', SkeletonText);

declare global {
  interface HTMLElementTagNameMap {
    'ui-skeleton-text': InstanceType<typeof SkeletonText>;
  }
}
