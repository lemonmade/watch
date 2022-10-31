import {InlineStack as UiInlineStack} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared';

export function InlineStack({
  children,
  spacing,
}: PropsForClipsComponent<'InlineStack'>) {
  return <UiInlineStack spacing={spacing}>{children}</UiInlineStack>;
}