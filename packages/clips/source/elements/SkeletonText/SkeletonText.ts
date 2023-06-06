import {
  createRemoteElement,
  BooleanOrString,
  type RemoteElementPropertyType,
} from '@lemonmade/remote-ui/elements';

import type {TextProperties} from '../Text.ts';

export interface SkeletonTextProperties
  extends Pick<TextProperties, 'emphasis'> {
  size?: 'small' | 'medium' | 'large';
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