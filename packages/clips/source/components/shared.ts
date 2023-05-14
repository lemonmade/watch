import {
  BooleanOrString,
  type RemoteElementPropertyType,
} from '@lemonmade/remote-ui/elements';

import {type SpacingValue, type CornerRadiusValue} from '../styles.ts';

export const RemoteElementSpacingValue =
  BooleanOrString as RemoteElementPropertyType<SpacingValue>;

export const RemoteElementCornerRadiusValue =
  BooleanOrString as RemoteElementPropertyType<CornerRadiusValue>;
