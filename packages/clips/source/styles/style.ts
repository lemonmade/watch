import {
  CSS_LITERAL_PREFIX,
  STYLE_DYNAMIC_VALUE_PREFIX,
  STYLE_DYNAMIC_VALUE_WHEN_PREFIX,
  STYLE_DYNAMIC_VALUE_VIEWPORT_CONDITION_PREFIX,
} from './constants.ts';
import type {
  CSSLiteralValue,
  DynamicValue,
  StyleDynamicValue,
  StyleDynamicValueCondition,
} from './types.ts';

export function css(
  strings: TemplateStringsArray,
  ...values: any[]
): CSSLiteralValue {
  let css = CSS_LITERAL_PREFIX as typeof CSS_LITERAL_PREFIX;

  for (let i = 0; i < strings.length; i++) {
    css += strings[i];

    if (i < values.length) {
      css += values[i];
    }
  }

  return css;
}

export function value<Value>(
  value: Value | DynamicValue<Value>,
  atLeastOneCondition: DynamicValue<Value>,
  ...otherCOnditions: DynamicValue<Value>[]
): StyleDynamicValue<Value>;
export function value<Value>(value: Value): Value;
export function value<Value>(
  value: Value | DynamicValue<Value>,
  ...conditions: DynamicValue<Value>[]
): Value | StyleDynamicValue<Value> {
  const firstIsDynamicValue = isDynamicValue<Value>(value);

  if (!firstIsDynamicValue && conditions.length === 0) {
    return value;
  }

  let style = '';

  if (firstIsDynamicValue) {
    style += dynamicValueToString(value);
  } else {
    style += dynamicValueToString({value});
  }

  for (const condition of conditions) {
    style += dynamicValueToString(condition);
  }

  return style as StyleDynamicValueCondition<Value>;
}

function dynamicValueToString<Value>(
  condition: DynamicValue<Value>,
): StyleDynamicValueCondition<Value> {
  let stringified = STYLE_DYNAMIC_VALUE_PREFIX;

  stringified += JSON.stringify(condition.value);

  if (condition.viewport != null) {
    stringified += `${STYLE_DYNAMIC_VALUE_WHEN_PREFIX}${STYLE_DYNAMIC_VALUE_VIEWPORT_CONDITION_PREFIX}${
      JSON.stringify(condition.viewport.min) ?? ''
    }>>${JSON.stringify(condition.viewport.max) ?? ''}`;
  }

  return stringified as StyleDynamicValueCondition<Value>;
}

function isDynamicValue<Value>(value: unknown): value is DynamicValue<Value> {
  return typeof value === 'object' && value != null && 'value' in value;
}
