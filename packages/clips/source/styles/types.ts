import type {SpacingKeyword} from '@watching/design';

import type {
  CSS_LITERAL_PREFIX,
  STYLE_DYNAMIC_VALUE_PREFIX,
  STYLE_DYNAMIC_VALUE_WHEN_PREFIX,
} from './constants.ts';

export type {SpacingKeyword};

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

export type CornerRadiusKeyword =
  | 'none'
  | /** @alias small */ 'small.1'
  | 'small'
  | 'base'
  | 'large'
  | /** @alias large */ 'large.1';
export type CornerRadiusValue = CornerRadiusKeyword | boolean;

export type ViewportSizeKeyword = 'small' | 'medium' | 'large';

export type AlignmentKeyword =
  | 'start'
  | 'end'
  | 'center'
  | 'stretch'
  | 'spaceBetween';
export type DirectionKeyword = 'inline' | 'block';
export type LayoutModeKeyword = 'logical' /* TODO: | 'physical' */;

export type SizeKeyword = 'auto' | 'fill' | 'hidden';
export type SizeValue = SizeKeyword | CSSLiteralValue | false;
