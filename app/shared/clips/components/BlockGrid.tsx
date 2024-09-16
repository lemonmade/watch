import {
  SPACING_KEYWORDS,
  ALIGNMENT_KEYWORDS,
  LAYOUT_MODE_KEYWORDS,
} from '@watching/design';
import {BlockGrid as UIBlockGrid} from '@lemon/zest';

import {useViewProps} from './View.tsx';
import {parseGridSizesAttribute} from './Grid.tsx';

import {
  createClipsComponentRenderer,
  restrictToAllowedValues,
  useRenderedChildren,
} from './shared.ts';

export const BlockGrid = createClipsComponentRenderer(
  'ui-block-grid',
  function BlockGrid(props) {
    const {children} = useRenderedChildren(props);

    const attributes = props.element.attributes.value;

    return (
      <UIBlockGrid
        {...useViewProps(props)}
        sizes={parseGridSizesAttribute(attributes.sizes)}
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
      </UIBlockGrid>
    );
  },
);
