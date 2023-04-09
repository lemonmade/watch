import {Section as UiSection} from '@lemon/zest';
import {type PropsForClipsComponent} from './shared.ts';

export function Section({
  children,
  padding,
  paddingBlockEnd,
  paddingBlockStart,
  paddingInlineEnd,
  paddingInlineStart,
}: PropsForClipsComponent<'Section'>) {
  return (
    <UiSection
      padding={padding}
      paddingBlockEnd={paddingBlockEnd}
      paddingBlockStart={paddingBlockStart}
      paddingInlineEnd={paddingInlineEnd}
      paddingInlineStart={paddingInlineStart}
    >
      {children}
    </UiSection>
  );
}
