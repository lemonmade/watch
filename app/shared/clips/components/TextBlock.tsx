import {TextBlock as UiTextBlock} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const TextBlock = createClipsComponent(
  'ui-text-block',
  function TextBlock({children}) {
    return <UiTextBlock>{children}</UiTextBlock>;
  },
);
