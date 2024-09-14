import {View as UIView} from '@lemon/zest';
import {SPACING_KEYWORDS} from '@watching/design';

import {
  createClipsComponentRenderer,
  useRenderedChildren,
  restrictToAllowedValues,
  type RemoteComponentRendererProps,
} from './shared.ts';

export const View = createClipsComponentRenderer(
  'ui-view',
  function View(props) {
    const {children} = useRenderedChildren(props);

    return <UIView {...useViewProps(props)}>{children}</UIView>;
  },
);

export function useViewProps({element}: RemoteComponentRendererProps) {
  const attributes = element.attributes.value;

  return {
    padding: restrictToAllowedValues(attributes.padding, SPACING_KEYWORDS),
    paddingInlineStart: restrictToAllowedValues(
      attributes.paddingInlineStart,
      SPACING_KEYWORDS,
    ),
    paddingInlineEnd: restrictToAllowedValues(
      attributes.paddingInlineEnd,
      SPACING_KEYWORDS,
    ),
    paddingBlockStart: restrictToAllowedValues(
      attributes.paddingBlockStart,
      SPACING_KEYWORDS,
    ),
    paddingBlockEnd: restrictToAllowedValues(
      attributes.paddingBlockEnd,
      SPACING_KEYWORDS,
    ),
  };
}
