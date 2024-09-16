import type {
  AlignmentKeyword,
  SpacingKeyword,
  CornerRadiusKeyword,
  DirectionKeyword,
  LayoutModeKeyword,
} from '@watching/design';

import type {
  CSS_LITERAL_PREFIX,
  STYLE_DYNAMIC_VALUE_PREFIX,
  STYLE_DYNAMIC_VALUE_WHEN_PREFIX,
} from './constants.ts';

export type {
  AlignmentKeyword,
  SpacingKeyword,
  CornerRadiusKeyword,
  DirectionKeyword,
  LayoutModeKeyword,
};

export type CSSLiteralValue = `${typeof CSS_LITERAL_PREFIX}${string}`;
// It’s a list of `StyleValueCondition`s, as a string. Not sure how to type it well.
export type StyleDynamicValue<Value> = string & {__value?: Value};
export type ValueOrStyleDynamicValue<Value> = Value | StyleDynamicValue<Value>;
export type ValueFromStyleDynamicValue<T> = T extends StyleDynamicValue<
  infer Value
>
  ? Value
  : never;
export type StyleDynamicValueCondition<_Value> =
  `${typeof STYLE_DYNAMIC_VALUE_PREFIX}${string}${
    | ''
    | `${typeof STYLE_DYNAMIC_VALUE_WHEN_PREFIX}${string}`}`;

export interface ViewportCondition {
  readonly min?: ViewportSizeKeyword;
  readonly max?: ViewportSizeKeyword;
}

export interface DynamicValue<Value> {
  readonly value: Value;
  readonly viewport?: ViewportCondition;
}

export type SpacingValue = SpacingKeyword | boolean;

export type CornerRadiusValue = CornerRadiusKeyword | boolean;

export type ViewportSizeKeyword = 'small' | 'medium' | 'large';
