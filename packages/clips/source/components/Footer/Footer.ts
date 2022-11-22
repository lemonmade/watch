import {createRemoteComponent} from '@remote-ui/core';
import {type ViewProps} from '../View';

export interface FooterProps extends ViewProps {}

/**
 * Footers are container elements that designates part of a section as being supplementary to the
 * main content. This typically includes content like additional, related navigation actions.
 *
 * This component accepts all the same props as the `View` component, so you don’t need to nest
 * an additional `View` to change basic styling props.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer
 */
export const Footer = createRemoteComponent<'Footer', FooterProps>('Footer');
