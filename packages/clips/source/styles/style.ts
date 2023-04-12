import {CSS_LITERAL_PREFIX} from './constants.ts';
import type {CSSLiteralValue} from './types.ts';

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
