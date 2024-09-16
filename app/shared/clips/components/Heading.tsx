import {Heading as UIHeading} from '@lemon/zest';
import {
  HEADING_LEVELS,
  type HeadingLevel,
  HEADING_ACCESSIBILITY_ROLE_KEYWORDS,
} from '@watching/design';

import {
  createClipsComponentRenderer,
  restrictToAllowedValues,
  useRenderedChildren,
} from './shared.ts';

export const Heading = createClipsComponentRenderer(
  'ui-heading',
  function Heading(props) {
    const {children} = useRenderedChildren(props);

    const attributes = props.element.attributes.value;

    return (
      <UIHeading
        level={
          attributes.level &&
          HEADING_LEVELS.has(Number(attributes.level) as HeadingLevel)
            ? (Number(attributes.level) as HeadingLevel)
            : undefined
        }
        divider={attributes.divider != null}
        accessibilityRole={restrictToAllowedValues(
          attributes['accessibility-role'],
          HEADING_ACCESSIBILITY_ROLE_KEYWORDS,
        )}
      >
        {children}
      </UIHeading>
    );
  },
);
