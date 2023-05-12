import {
  Grid as UiGrid,
  BlockGrid as UiBlockGrid,
  InlineGrid as UiInlineGrid,
} from '@lemon/zest';
import {type ReactComponentPropsForClipsElement} from './shared';

export function Grid({
  ...props
}: ReactComponentPropsForClipsElement<'ui-grid'>) {
  return <UiGrid {...props} />;
}

export function InlineGrid({
  ...props
}: ReactComponentPropsForClipsElement<'ui-inline-grid'>) {
  return <UiInlineGrid {...props} />;
}

export function BlockGrid({
  ...props
}: ReactComponentPropsForClipsElement<'ui-block-grid'>) {
  return <UiBlockGrid {...props} />;
}
