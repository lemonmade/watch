import {Footer as UiFooter} from '@lemon/zest';
import {type ReactComponentPropsForClipsElement} from './shared.ts';

export function Footer({
  children,
  padding,
  paddingBlockEnd,
  paddingBlockStart,
  paddingInlineEnd,
  paddingInlineStart,
}: ReactComponentPropsForClipsElement<'ui-footer'>) {
  return (
    <UiFooter
      padding={padding}
      paddingBlockEnd={paddingBlockEnd}
      paddingBlockStart={paddingBlockStart}
      paddingInlineEnd={paddingInlineEnd}
      paddingInlineStart={paddingInlineStart}
    >
      {children}
    </UiFooter>
  );
}
