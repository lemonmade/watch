import {Text as UiText} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const Text = createClipsComponent(
  'ui-text',
  function Text({children, emphasis}) {
    return <UiText emphasis={emphasis}>{children}</UiText>;
  },
);
