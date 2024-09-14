import {
  View,
  type ViewAttributes,
  type ViewProperties,
  type ViewEvents,
} from '../View.ts';

export interface HeaderAttributes extends ViewAttributes {}
export interface HeaderProperties extends ViewProperties {}
export interface HeaderEvents extends ViewEvents {}

/**
 * Headers are container elements that designates part of a section as “introductory content”,
 * typically containing a title and/ or navigation actions.
 *
 * This component accepts all the same props as the `View` component, so you don’t need to nest
 * an additional `View` to change basic styling props.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header
 */
export class Header extends View implements HeaderProperties {}

customElements.define('ui-header', Header);

declare global {
  interface HTMLElementTagNameMap {
    'ui-header': InstanceType<typeof Header>;
  }
}
