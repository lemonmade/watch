import {TextBlock as UiTextBlock} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared';

export function TextBlock({children}: PropsForClipsComponent<'TextBlock'>) {
  return <UiTextBlock>{children}</UiTextBlock>;
}
