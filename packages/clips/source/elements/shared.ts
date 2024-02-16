import {
  BooleanOrString,
  type RemoteElementPropertyType,
} from '@remote-dom/core/elements';

import {type SpacingValue, type CornerRadiusValue} from '../styles.ts';

export const RemoteElementSpacingValue =
  BooleanOrString as RemoteElementPropertyType<SpacingValue>;

export const RemoteElementCornerRadiusValue =
  BooleanOrString as RemoteElementPropertyType<CornerRadiusValue>;
