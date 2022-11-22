import {Footer as UiFooter} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared';

export function Footer({
  children,
  padding,
  paddingBlockEnd,
  paddingBlockStart,
  paddingInlineEnd,
  paddingInlineStart,
}: PropsForClipsComponent<'Footer'>) {
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
