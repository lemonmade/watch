import {createRemoteElement} from '@lemonmade/remote-ui/elements';
import {VIEW_PROPERTIES, type ViewProperties} from '../View.ts';

export interface FooterProperties extends ViewProperties {}

/**
 * Footers are container elements that designates part of a section as being supplementary to the
 * main content. This typically includes content like additional, related navigation actions.
 *
 * This component accepts all the same props as the `View` component, so you don’t need to nest
 * an additional `View` to change basic styling props.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer
 */
export const Footer = createRemoteElement<FooterProperties>({
  properties: VIEW_PROPERTIES,
});

customElements.define('ui-footer', Footer);

declare global {
  interface HTMLElementTagNameMap {
    'ui-footer': InstanceType<typeof Footer>;
  }
}
