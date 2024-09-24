import type {RenderableProps} from 'preact';

import {NestedHeadingLevel} from '../Heading/Heading.tsx';
import {useViewProps, resolveViewProps, type ViewProps} from '../View/View.tsx';

export interface SectionProps extends ViewProps {}

export function Section({
  children,
  ...viewProps
}: RenderableProps<SectionProps>) {
  const view = useViewProps(viewProps);

  return (
    <NestedHeadingLevel>
      <section {...resolveViewProps(view)}>{children}</section>
    </NestedHeadingLevel>
  );
}
