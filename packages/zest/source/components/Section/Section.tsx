import {type PropsWithChildren} from 'react';
import {NestedHeadingLevel} from '../Heading';

import {useViewProps, resolveViewProps, type ViewProps} from '../View';

interface Props extends ViewProps {}

export function Section({children, ...viewProps}: PropsWithChildren<Props>) {
  const view = useViewProps(viewProps);

  return (
    <NestedHeadingLevel>
      <section {...resolveViewProps(view)}>{children}</section>
    </NestedHeadingLevel>
  );
}
