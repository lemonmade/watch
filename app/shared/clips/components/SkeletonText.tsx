import {SkeletonText as UISkeletonText} from '@lemon/zest';
import {
  TEXT_EMPHASIS_KEYWORDS,
  SKELETON_TEXT_SIZE_KEYWORDS,
} from '@watching/design';

import {
  createClipsComponentRenderer,
  useRenderedChildren,
  restrictToAllowedValues,
} from './shared.ts';

export const SkeletonText = createClipsComponentRenderer(
  'ui-skeleton-text',
  function SkeletonText(props) {
    const {children} = useRenderedChildren(props);

    const attributes = props.element.attributes.value;

    return (
      <UISkeletonText
        emphasis={restrictToAllowedValues(
          attributes.emphasis,
          TEXT_EMPHASIS_KEYWORDS,
        )}
        size={restrictToAllowedValues(
          attributes.size,
          SKELETON_TEXT_SIZE_KEYWORDS,
        )}
      >
        {children}
      </UISkeletonText>
    );
  },
);
