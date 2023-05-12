import {Text as UiText} from '@lemon/zest';
import {type ReactComponentPropsForClipsElement} from './shared.ts';

export function Text({
  children,
  emphasis,
}: ReactComponentPropsForClipsElement<'ui-text'>) {
  return <UiText emphasis={emphasis}>{children}</UiText>;
}
