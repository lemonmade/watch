import {NestedHeadingLevel} from '../Heading.tsx';
import {useViewProps, resolveViewProps, type ViewProps} from '../View.tsx';

import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';

export type SectionProps = ReactComponentPropsForClipsElement<'ui-section'> &
  ViewProps;

export function Section({children, ...viewProps}: SectionProps) {
  const view = useViewProps(viewProps);

  return (
    <NestedHeadingLevel>
      <section {...resolveViewProps(view)}>{children}</section>
    </NestedHeadingLevel>
  );
}
