import {Section as UISection} from '@lemon/zest';
import {createClipsComponentRenderer, useRenderedChildren} from './shared.ts';

import {useViewProps} from './View.tsx';

export const Section = createClipsComponentRenderer(
  'ui-section',
  function Section(props) {
    const {children} = useRenderedChildren(props);

    return <UISection {...useViewProps(props)}>{children}</UISection>;
  },
);
