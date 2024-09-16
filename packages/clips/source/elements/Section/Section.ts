import {
  View,
  type ViewAttributes,
  type ViewProperties,
  type ViewEvents,
} from '../View/View.ts';

export interface SectionAttributes extends ViewAttributes {}
export interface SectionProperties extends ViewProperties {}
export interface SectionEvents extends ViewEvents {}

/**
 * Sections are container elements that create semantic groupings of content. Most notably,
 * they will increment the heading level of any `Heading` components rendered inside.
 *
 * This component accepts all the same attributes as the `View` component, so you don't need to nest
 * an additional `View` to change basic styling attributes.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section
 */
export class Section extends View implements SectionProperties {}

customElements.define('ui-section', Section);

declare global {
  interface HTMLElementTagNameMap {
    'ui-section': InstanceType<typeof Section>;
  }
}
