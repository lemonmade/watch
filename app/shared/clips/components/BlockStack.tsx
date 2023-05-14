import {BlockStack as UiBlockStack} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const BlockStack = createClipsComponent(
  'ui-block-stack',
  function BlockStack({
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
      <UiBlockStack
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
      </UiBlockStack>
    );
  },
);
