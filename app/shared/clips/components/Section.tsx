import {Section as UiSection} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const Section = createClipsComponent(
  'ui-section',
  function Section({
    children,
    padding,
    paddingBlockEnd,
    paddingBlockStart,
    paddingInlineEnd,
    paddingInlineStart,
  }) {
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
  },
);
