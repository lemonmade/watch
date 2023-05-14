import {Header as UiHeader} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const Header = createClipsComponent(
  'ui-header',
  function Header({
    children,
    padding,
    paddingBlockEnd,
    paddingBlockStart,
    paddingInlineEnd,
    paddingInlineStart,
  }) {
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
  },
);
