import {
  SPACING_KEYWORDS,
  ALIGNMENT_KEYWORDS,
  LAYOUT_MODE_KEYWORDS,
} from '@watching/design';
import {InlineStack as UIInlineStack} from '@lemon/zest';

import {useViewProps} from './View.tsx';

import {
  createClipsComponentRenderer,
  restrictToAllowedValues,
  useRenderedChildren,
} from './shared.ts';

export const InlineStack = createClipsComponentRenderer(
  'ui-inline-stack',
  function InlineStack(props) {
    const {children} = useRenderedChildren(props);

    const attributes = props.element.attributes.value;

    return (
      <UIInlineStack
        {...useViewProps(props)}
        spacing={restrictToAllowedValues(attributes.spacing, SPACING_KEYWORDS)}
        inlineAlignment={restrictToAllowedValues(
          attributes.inlineAlignment,
          ALIGNMENT_KEYWORDS,
        )}
        blockAlignment={restrictToAllowedValues(
          attributes.blockAlignment,
          ALIGNMENT_KEYWORDS,
        )}
        layoutMode={restrictToAllowedValues(
          attributes.layoutMode,
          LAYOUT_MODE_KEYWORDS,
        )}
      >
        {children}
      </UIInlineStack>
    );
  },
);
