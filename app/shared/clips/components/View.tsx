import {View as UiView} from '@lemon/zest';
import {type ReactComponentPropsForClipsElement} from './shared.ts';

export function View({
  children,
  padding,
  paddingInlineStart,
  paddingInlineEnd,
  paddingBlockStart,
  paddingBlockEnd,
}: ReactComponentPropsForClipsElement<'ui-view'>) {
  return (
    <UiView
      padding={padding}
      paddingInlineStart={paddingInlineStart}
      paddingInlineEnd={paddingInlineEnd}
      paddingBlockStart={paddingBlockStart}
      paddingBlockEnd={paddingBlockEnd}
    >
      {children}
    </UiView>
  );
}
