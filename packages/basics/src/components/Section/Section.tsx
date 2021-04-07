import type {ComponentProps} from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import {AutoHeadingGroup} from '@quilted/react-auto-headings';

import {View} from '../View';

export function Section(
  props: Omit<ComponentProps<typeof View>, 'accessibilityRole'>,
) {
  return (
    <AutoHeadingGroup>
      <View accessibilityRole="section" {...props} />
    </AutoHeadingGroup>
  );
}
