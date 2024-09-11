import {Text as UIText} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const Text = createClipsComponent(
  'ui-text',
  function Text({children, emphasis}) {
    return <UIText emphasis={emphasis}>{children}</UIText>;
  },
);
