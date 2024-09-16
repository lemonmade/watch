import {Footer as UIFooter} from '@lemon/zest';

import {useViewProps} from './View.tsx';

import {createClipsComponentRenderer, useRenderedChildren} from './shared.ts';

export const Footer = createClipsComponentRenderer(
  'ui-footer',
  function Footer(props) {
    const {children} = useRenderedChildren(props);

    return <UIFooter {...useViewProps(props)}>{children}</UIFooter>;
  },
);
