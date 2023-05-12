import {
  Stack as UiStack,
  BlockStack as UiBlockStack,
  InlineStack as UiInlineStack,
} from '@lemon/zest';
import {type ReactComponentPropsForClipsElement} from './shared.ts';

export function Stack({
  ...props
}: ReactComponentPropsForClipsElement<'ui-stack'>) {
  return <UiStack {...props} />;
}

export function InlineStack({
  ...props
}: ReactComponentPropsForClipsElement<'ui-inline-stack'>) {
  return <UiInlineStack {...props} />;
}

export function BlockStack({
  ...props
}: ReactComponentPropsForClipsElement<'ui-block-stack'>) {
  return <UiBlockStack {...props} />;
}
