import {Stack as UiStack} from '@lemon/zest';
import {createClipsComponent} from './shared.ts';

export const Stack = createClipsComponent(
  'ui-stack',
  function Stack({
    children,
    direction,
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
      <UiStack
        direction={direction}
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
      </UiStack>
    );
  },
);
