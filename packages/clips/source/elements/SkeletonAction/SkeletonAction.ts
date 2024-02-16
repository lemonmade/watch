import {createRemoteElement} from '@remote-dom/core/elements';

import type {CSSLiteralValue} from '../../styles.ts';

export interface SkeletonActionProperties {
  size?: 'small' | 'medium' | 'large' | CSSLiteralValue;
}

export const SkeletonAction = createRemoteElement<SkeletonActionProperties>({
  properties: {
    size: {
      type: String,
    },
  },
});

customElements.define('ui-skeleton-action', SkeletonAction);

declare global {
  interface HTMLElementTagNameMap {
    'ui-skeleton-action': InstanceType<typeof SkeletonAction>;
  }
}
