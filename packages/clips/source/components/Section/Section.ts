import {createRemoteElement} from '@lemonmade/remote-ui/elements';
import {VIEW_PROPERTIES, type ViewProperties} from '../View.ts';

export interface SectionProperties extends ViewProperties {}

export const Section = 'ui-section';

/**
 * Sections are container elements that create semantic groupings of content. Most notably,
 * the will increment the heading level of any `Heading` components rendered inside.
 *
 * This component accepts all the same props as the `View` component, so you don’t need to nest
 * an additional `View` to change basic styling props.
 */
export const SectionElement = createRemoteElement<SectionProperties>({
  properties: VIEW_PROPERTIES,
});

customElements.define(Section, SectionElement);

declare global {
  interface HTMLElementTagNameMap {
    [Section]: InstanceType<typeof SectionElement>;
  }
}
