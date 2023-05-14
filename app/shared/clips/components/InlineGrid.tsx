import {InlineGrid as UiInlineGrid} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const InlineGrid = createClipsComponent(
  'ui-inline-grid',
  function InlineGrid({
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
      <UiInlineGrid
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
      </UiInlineGrid>
    );
  },
);
