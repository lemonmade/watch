import {createRemoteElement} from '@lemonmade/remote-ui/elements';

export interface SkeletonActionProperties {}

export const SkeletonAction = createRemoteElement<SkeletonActionProperties>({
  properties: {
    lines: {
      type: Number,
    },
  },
});

customElements.define('ui-skeleton-action', SkeletonAction);

declare global {
  interface HTMLElementTagNameMap {
    'ui-skeleton-action': InstanceType<typeof SkeletonAction>;
  }
}
