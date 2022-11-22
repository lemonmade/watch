import {createRemoteComponent} from '@remote-ui/core';
import {type ViewProps} from '../View';

export interface SectionProps extends ViewProps {}

/**
 * Sections are container elements that create semantic groupings of content. Most notably,
 * the will increment the heading level of any `Heading` components rendered inside.
 *
 * This component accepts all the same props as the `View` component, so you don’t need to nest
 * an additional `View` to change basic styling props.
 */
export const Section = createRemoteComponent<'Section', SectionProps>(
  'Section',
);
