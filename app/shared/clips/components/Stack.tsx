import {
  SPACING_KEYWORDS,
  DIRECTION_KEYWORDS,
  ALIGNMENT_KEYWORDS,
  LAYOUT_MODE_KEYWORDS,
} from '@watching/design';
import {Stack as UIStack} from '@lemon/zest';

import {useViewProps} from './View.tsx';

import {
  createClipsComponentRenderer,
  restrictToAllowedValues,
  useRenderedChildren,
} from './shared.ts';

export const Stack = createClipsComponentRenderer(
  'ui-stack',
  function Stack(props) {
    const {children} = useRenderedChildren(props);

    const attributes = props.element.attributes.value;

    return (
      <UIStack
        {...useViewProps(props)}
        direction={restrictToAllowedValues(
          attributes.direction,
          DIRECTION_KEYWORDS,
        )}
        spacing={restrictToAllowedValues(attributes.spacing, SPACING_KEYWORDS)}
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
      </UIStack>
    );
  },
);
