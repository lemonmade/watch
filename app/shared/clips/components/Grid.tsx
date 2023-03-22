import {
  Grid as UiGrid,
  BlockGrid as UiBlockGrid,
  InlineGrid as UiInlineGrid,
} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared';

export function Grid({...props}: PropsForClipsComponent<'Grid'>) {
  return <UiGrid {...props} />;
}

export function InlineGrid({...props}: PropsForClipsComponent<'InlineGrid'>) {
  return <UiInlineGrid {...props} />;
}

export function BlockGrid({...props}: PropsForClipsComponent<'BlockGrid'>) {
  return <UiBlockGrid {...props} />;
}
