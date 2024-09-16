import {
  View,
  type ViewAttributes,
  type ViewProperties,
  type ViewEvents,
} from '../View/View.ts';

export interface SkeletonViewAttributes extends ViewAttributes {}
export interface SkeletonViewProperties extends ViewProperties {}
export interface SkeletonViewEvents extends ViewEvents {}

/**
 * SkeletonView is a placeholder component used to represent the structure of content
 * while it's loading. It extends the View component and inherits all its properties.
 */
export class SkeletonView
  extends View<SkeletonViewAttributes, SkeletonViewEvents>
  implements SkeletonViewProperties {}

customElements.define('ui-skeleton-view', SkeletonView);

declare global {
  interface HTMLElementTagNameMap {
    'ui-skeleton-view': InstanceType<typeof SkeletonView>;
  }
}
