import {InlineStack as UiInlineStack} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const InlineStack = createClipsComponent(
  'ui-inline-stack',
  function InlineStack({
    children,
    spacing,
    blockAlignment,
    inlineAlignment,
    layoutMode,
    padding,
    paddingBlockEnd,
    paddingBlockStart,
    paddingInlineEnd,
    paddingInlineStart,
  }) {
    return (
      <UiInlineStack
        spacing={spacing}
        blockAlignment={blockAlignment}
        inlineAlignment={inlineAlignment}
        layoutMode={layoutMode}
        padding={padding}
        paddingBlockEnd={paddingBlockEnd}
        paddingBlockStart={paddingBlockStart}
        paddingInlineEnd={paddingInlineEnd}
        paddingInlineStart={paddingInlineStart}
      >
        {children}
      </UiInlineStack>
    );
  },
);
