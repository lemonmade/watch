import {
  SPACING_KEYWORDS,
  DIRECTION_KEYWORDS,
  ALIGNMENT_KEYWORDS,
  LAYOUT_MODE_KEYWORDS,
} from '@watching/design';
import {Grid as UIGrid, type GridSizeValue, DynamicStyle} from '@lemon/zest';

import {useViewProps} from './View.tsx';

import {
  createClipsComponentRenderer,
  restrictToAllowedValues,
  useRenderedChildren,
} from './shared.ts';

export const Grid = createClipsComponentRenderer(
  'ui-grid',
  function Grid(props) {
    const {children} = useRenderedChildren(props);

    const attributes = props.element.attributes.value;

    return (
      <UIGrid
        {...useViewProps(props)}
        direction={restrictToAllowedValues(
          attributes.direction,
          DIRECTION_KEYWORDS,
        )}
        blockSizes={parseGridSizesAttribute(attributes.blockSizes)}
        inlineSizes={parseGridSizesAttribute(attributes.inlineSizes)}
        spacing={restrictToAllowedValues(attributes.spacing, SPACING_KEYWORDS)}
        blockSpacing={restrictToAllowedValues(
          attributes.blockSpacing,
          SPACING_KEYWORDS,
        )}
        inlineSpacing={restrictToAllowedValues(
          attributes.inlineSpacing,
          SPACING_KEYWORDS,
        )}
        blockAlignment={restrictToAllowedValues(
          attributes.blockAlignment,
          ALIGNMENT_KEYWORDS,
        )}
        inlineAlignment={restrictToAllowedValues(
          attributes.inlineAlignment,
          ALIGNMENT_KEYWORDS,
        )}
        layoutMode={restrictToAllowedValues(
          attributes.layoutMode,
          LAYOUT_MODE_KEYWORDS,
        )}
      >
        {children}
      </UIGrid>
    );
  },
);

export function parseGridSizesAttribute(value: string | undefined) {
  if (!value) return undefined;

  return DynamicStyle.test<readonly GridSizeValue[]>(value)
    ? value
    : (value.split(' ') as readonly GridSizeValue[]);
}
