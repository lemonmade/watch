import {TextBlock as UiTextBlock} from '@lemon/zest';
import {type ReactComponentPropsForClipsElement} from './shared.ts';

export function TextBlock({
  children,
}: ReactComponentPropsForClipsElement<'ui-text-block'>) {
  return <UiTextBlock>{children}</UiTextBlock>;
}
