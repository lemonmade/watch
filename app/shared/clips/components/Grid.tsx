import {Grid as UiGrid} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const Grid = createClipsComponent(
  'ui-grid',
  function Grid({
    children,
    direction,
    blockSizes,
    inlineSizes,
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
      <UiGrid
        direction={direction}
        blockSizes={blockSizes}
        inlineSizes={inlineSizes}
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
      </UiGrid>
    );
  },
);
