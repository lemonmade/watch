import {createRemoteElement} from '@lemonmade/remote-ui/elements';
import {VIEW_PROPERTIES, type ViewProperties} from '../View.ts';

export interface HeaderProperties extends ViewProperties {}

export const Header = 'ui-header';

/**
 * Headers are container elements that designates part of a section as “introductory content”,
 * typically containing a title and/ or navigation actions.
 *
 * This component accepts all the same props as the `View` component, so you don’t need to nest
 * an additional `View` to change basic styling props.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header
 */
export const HeaderElement = createRemoteElement<HeaderProperties>({
  properties: VIEW_PROPERTIES,
});

customElements.define(Header, HeaderElement);

declare global {
  interface HTMLElementTagNameMap {
    [Header]: InstanceType<typeof HeaderElement>;
  }
}
