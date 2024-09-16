import {Header as UIHeader} from '@lemon/zest';

import {useViewProps} from './View.tsx';

import {createClipsComponentRenderer, useRenderedChildren} from './shared.ts';

export const Header = createClipsComponentRenderer(
  'ui-header',
  function Header(props) {
    const {children} = useRenderedChildren(props);

    return <UIHeader {...useViewProps(props)}>{children}</UIHeader>;
  },
);
