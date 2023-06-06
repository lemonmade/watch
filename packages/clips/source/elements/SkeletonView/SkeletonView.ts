import {createRemoteElement} from '@lemonmade/remote-ui/elements';

import {VIEW_PROPERTIES, type ViewProperties} from '../View.ts';

export interface SkeletonViewProperties extends ViewProperties {}

export const SkeletonView = createRemoteElement<SkeletonViewProperties>({
  properties: VIEW_PROPERTIES,
});

customElements.define('ui-skeleton-view', SkeletonView);

declare global {
  interface HTMLElementTagNameMap {
    'ui-skeleton-view': InstanceType<typeof SkeletonView>;
  }
}
