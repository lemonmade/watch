import {Image as UIImage} from '@lemon/zest';
import {
  IMAGE_ACCESSIBILITY_ROLE_KEYWORDS,
  IMAGE_FIT_KEYWORDS,
  IMAGE_LOADING_KEYWORDS,
  CORNER_RADIUS_KEYWORDS,
} from '@watching/design';

import {
  createClipsComponentRenderer,
  restrictToAllowedValues,
} from './shared.ts';

export const Image = createClipsComponentRenderer(
  'ui-image',
  function Image(props) {
    const attributes = props.element.attributes.value;

    return (
      <UIImage
        source={attributes.source}
        description={attributes.description}
        accessibilityRole={restrictToAllowedValues(
          attributes['accessibility-role'],
          IMAGE_ACCESSIBILITY_ROLE_KEYWORDS,
        )}
        fit={restrictToAllowedValues(attributes.fit, IMAGE_FIT_KEYWORDS)}
        loading={restrictToAllowedValues(
          attributes.loading,
          IMAGE_LOADING_KEYWORDS,
        )}
        aspectRatio={
          attributes.aspectRatio ? Number(attributes.aspectRatio) : undefined
        }
        cornerRadius={restrictToAllowedValues(
          attributes.cornerRadius,
          CORNER_RADIUS_KEYWORDS,
        )}
      />
    );
  },
);
