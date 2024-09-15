import {
  SPACING_KEYWORDS,
  ALIGNMENT_KEYWORDS,
  LAYOUT_MODE_KEYWORDS,
} from '@watching/design';
import {InlineGrid as UIInlineGrid} from '@lemon/zest';

import {useViewProps} from './View.tsx';
import {parseGridSizesAttribute} from './Grid.tsx';

import {
  createClipsComponentRenderer,
  restrictToAllowedValues,
  useRenderedChildren,
} from './shared.ts';

export const InlineGrid = createClipsComponentRenderer(
  'ui-inline-grid',
  function InlineGrid(props) {
    const {children} = useRenderedChildren(props);

    const attributes = props.element.attributes.value;

    return (
      <UIInlineGrid
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
      </UIInlineGrid>
    );
  },
);
