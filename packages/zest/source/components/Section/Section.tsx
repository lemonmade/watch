import {NestedHeadingLevel} from '../Heading';
import {type PropsForClipsComponent} from '../../utilities/clips';

import {useViewProps, resolveViewProps, type ViewProps} from '../View';

export type SectionProps = PropsForClipsComponent<'Section'> & ViewProps;

export function Section({children, ...viewProps}: SectionProps) {
  const view = useViewProps(viewProps);

  return (
    <NestedHeadingLevel>
      <section {...resolveViewProps(view)}>{children}</section>
    </NestedHeadingLevel>
  );
}
