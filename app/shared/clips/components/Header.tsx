import {Header as UiHeader} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared';

export function Header({
  children,
  padding,
  paddingBlockEnd,
  paddingBlockStart,
  paddingInlineEnd,
  paddingInlineStart,
}: PropsForClipsComponent<'Header'>) {
  return (
    <UiHeader
      padding={padding}
      paddingBlockEnd={paddingBlockEnd}
      paddingBlockStart={paddingBlockStart}
      paddingInlineEnd={paddingInlineEnd}
      paddingInlineStart={paddingInlineStart}
    >
      {children}
    </UiHeader>
  );
}
