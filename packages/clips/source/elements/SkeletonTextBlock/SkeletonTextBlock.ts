import {createRemoteElement} from '@lemonmade/remote-ui/elements';

export interface SkeletonTextBlockProperties {
  lines?: number;
}

export const SkeletonTextBlock =
  createRemoteElement<SkeletonTextBlockProperties>({
    properties: {
      lines: {
        type: Number,
      },
    },
  });

customElements.define('ui-skeleton-text-block', SkeletonTextBlock);

declare global {
  interface HTMLElementTagNameMap {
    'ui-skeleton-text-block': InstanceType<typeof SkeletonTextBlock>;
  }
}
