import {BlockStack as UiBlockStack} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared.ts';

export function BlockStack({
  children,
  spacing,
}: PropsForClipsComponent<'BlockStack'>) {
  return <UiBlockStack spacing={spacing}>{children}</UiBlockStack>;
}
