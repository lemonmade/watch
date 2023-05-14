import {BlockGrid as UiBlockGrid} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const BlockGrid = createClipsComponent(
  'ui-block-grid',
  function BlockGrid({
    children,
    sizes,
    spacing,
    blockSpacing,
    inlineSpacing,
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
      <UiBlockGrid
        sizes={sizes}
        spacing={spacing}
        blockSpacing={blockSpacing}
        inlineSpacing={inlineSpacing}
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
      </UiBlockGrid>
    );
  },
);
