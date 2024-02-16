import {createRemoteElement} from '@remote-dom/core/elements';
import {VIEW_PROPERTIES, type ViewProperties} from '../View.ts';

export interface SectionProperties extends ViewProperties {}

/**
 * Sections are container elements that create semantic groupings of content. Most notably,
 * the will increment the heading level of any `Heading` components rendered inside.
 *
 * This component accepts all the same props as the `View` component, so you don’t need to nest
 * an additional `View` to change basic styling props.
 */
export const Section = createRemoteElement<SectionProperties>({
  properties: VIEW_PROPERTIES,
});

customElements.define('ui-section', Section);

declare global {
  interface HTMLElementTagNameMap {
    'ui-section': InstanceType<typeof Section>;
  }
}
