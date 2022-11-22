import {createRemoteComponent} from '@remote-ui/core';
import {type ViewProps} from '../View';

export interface HeaderProps extends ViewProps {}

/**
 * Headers are container elements that designates part of a section as “introductory content”,
 * typically containing a title and/ or navigation actions.
 *
 * This component accepts all the same props as the `View` component, so you don’t need to nest
 * an additional `View` to change basic styling props.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header
 */
export const Header = createRemoteComponent<'Header', HeaderProps>('Header');
