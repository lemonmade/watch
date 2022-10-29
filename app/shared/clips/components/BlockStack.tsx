import {BlockStack as UiBlockStack} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared';

export function BlockStack({
  children,
  spacing,
}: PropsForClipsComponent<'BlockStack'>) {
  return <UiBlockStack spacing={spacing}>{children}</UiBlockStack>;
}
