import {
  View,
  type ViewAttributes,
  type ViewProperties,
  type ViewEvents,
} from '../View/View.ts';

export interface FooterAttributes extends ViewAttributes {}
export interface FooterProperties extends ViewProperties {}
export interface FooterEvents extends ViewEvents {}

/**
 * Footers are container elements that designates part of a section as being supplementary to the
 * main content. This typically includes content like additional, related navigation actions.
 *
 * This component accepts all the same props as the `View` component, so you don’t need to nest
 * an additional `View` to change basic styling props.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer
 */
export class Footer extends View implements FooterProperties {}

customElements.define('ui-footer', Footer);

declare global {
  interface HTMLElementTagNameMap {
    'ui-footer': InstanceType<typeof Footer>;
  }
}
