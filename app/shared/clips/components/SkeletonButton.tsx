import {SkeletonButton as UISkeletonButton} from '@lemon/zest';
import {SKELETON_BUTTON_SIZE_KEYWORDS} from '@watching/design';

import {
  createClipsComponentRenderer,
  useRenderedChildren,
  restrictToAllowedValues,
} from './shared.ts';

export const SkeletonButton = createClipsComponentRenderer(
  'ui-skeleton-button',
  function SkeletonButton(props) {
    const {children} = useRenderedChildren(props);

    const attributes = props.element.attributes.value;

    return (
      <UISkeletonButton
        size={restrictToAllowedValues(
          attributes.size,
          SKELETON_BUTTON_SIZE_KEYWORDS,
        )}
      >
        {children}
      </UISkeletonButton>
    );
  },
);
