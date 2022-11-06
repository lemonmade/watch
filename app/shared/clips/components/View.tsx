import {View as UiView} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared';

export function View({
  children,
  padding,
  paddingInlineStart,
  paddingInlineEnd,
  paddingBlockStart,
  paddingBlockEnd,
}: PropsForClipsComponent<'View'>) {
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
