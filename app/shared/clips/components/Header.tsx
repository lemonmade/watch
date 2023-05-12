import {Header as UiHeader} from '@lemon/zest';
import {type ReactComponentPropsForClipsElement} from './shared.ts';

export function Header({
  children,
  padding,
  paddingBlockEnd,
  paddingBlockStart,
  paddingInlineEnd,
  paddingInlineStart,
}: ReactComponentPropsForClipsElement<'ui-header'>) {
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
