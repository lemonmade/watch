import {Footer as UiFooter} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const Footer = createClipsComponent(
  'ui-footer',
  function Footer({
    children,
    padding,
    paddingBlockEnd,
    paddingBlockStart,
    paddingInlineEnd,
    paddingInlineStart,
  }) {
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
  },
);
