import {Section as UiSection} from '@lemon/zest';
import {type ReactComponentPropsForClipsElement} from './shared.ts';

export function Section({
  children,
  padding,
  paddingBlockEnd,
  paddingBlockStart,
  paddingInlineEnd,
  paddingInlineStart,
}: ReactComponentPropsForClipsElement<'ui-section'>) {
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
