import {SkeletonAction as UISkeletonAction} from '@lemon/zest';
import {SKELETON_ACTION_SIZE_KEYWORDS} from '@watching/design';

import {
  createClipsComponentRenderer,
  useRenderedChildren,
  restrictToAllowedValues,
} from './shared.ts';

export const SkeletonAction = createClipsComponentRenderer(
  'ui-skeleton-action',
  function SkeletonAction(props) {
    const {children} = useRenderedChildren(props);

    const attributes = props.element.attributes.value;

    return (
      <UISkeletonAction
        size={restrictToAllowedValues(
          attributes.size,
          SKELETON_ACTION_SIZE_KEYWORDS,
        )}
      >
        {children}
      </UISkeletonAction>
    );
  },
);
