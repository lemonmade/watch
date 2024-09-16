import {TextBlock as UITextBlock} from '@lemon/zest';

import {createClipsComponentRenderer, useRenderedChildren} from './shared.ts';

export const TextBlock = createClipsComponentRenderer(
  'ui-text-block',
  function TextBlock(props) {
    const {children} = useRenderedChildren(props);

    return <UITextBlock>{children}</UITextBlock>;
  },
);
