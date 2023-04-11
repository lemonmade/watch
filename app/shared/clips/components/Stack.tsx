import {
  Stack as UiStack,
  BlockStack as UiBlockStack,
  InlineStack as UiInlineStack,
} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared';

export function Stack({...props}: PropsForClipsComponent<'Stack'>) {
  return <UiStack {...props} />;
}

export function InlineStack({...props}: PropsForClipsComponent<'InlineStack'>) {
  return <UiInlineStack {...props} />;
}

export function BlockStack({...props}: PropsForClipsComponent<'BlockStack'>) {
  return <UiBlockStack {...props} />;
}
