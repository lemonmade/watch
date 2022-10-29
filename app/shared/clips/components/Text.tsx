import {Text as UiText} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared';

export function Text({children, emphasis}: PropsForClipsComponent<'Text'>) {
  return <UiText emphasis={emphasis}>{children}</UiText>;
}
