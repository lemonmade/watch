import {Text as UIText} from '@lemon/zest';
import {TEXT_EMPHASIS_KEYWORDS} from '@watching/design';

import {
  createClipsComponentRenderer,
  useRenderedChildren,
  restrictToAllowedValues,
} from './shared.ts';

export const Text = createClipsComponentRenderer(
  'ui-text',
  function Text(props) {
    const {children} = useRenderedChildren(props);
    const attributes = props.element.attributes.value;

    return (
      <UIText
        emphasis={restrictToAllowedValues(
          attributes.emphasis,
          TEXT_EMPHASIS_KEYWORDS,
        )}
      >
        {children}
      </UIText>
    );
  },
);
