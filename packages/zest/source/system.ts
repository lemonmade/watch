import {
  Style,
  type CSSLiteralValue,
  type SpacingKeyword as ClipsSpacingKeyword,
} from '@watching/clips';

export {Style, type CSSLiteralValue};

export const CSSLiteral = {
  test(value: unknown): value is CSSLiteralValue {
    return typeof value === 'string' && value.startsWith('@@css:');
  },
  parse(value: CSSLiteralValue): string {
    return value.slice(6);
  },
};

export type SpacingKeyword = ClipsSpacingKeyword;
export type BorderKeyword = 'none' | 'base' | 'emphasized' | 'subdued';
export type CornerRadiusKeyword = 'none' | 'base' | 'concentric';
export type BackgroundKeyword = 'none' | 'base' | 'emphasized' | 'subdued';
export type EmphasisKeyword = 'emphasized' | 'subdued';
export type EmphasisValue = EmphasisKeyword | boolean;
export type ActionRoleKeyword = 'destructive';
export type BasicAlignmentKeyword = 'start' | 'center' | 'end';
export type AlignKeyword = BasicAlignmentKeyword | 'spaceBetween';

export interface Position {
  type: 'relative' | 'absolute';
  block?: 'start' | 'center' | 'end';
  inline?: 'start' | 'center' | 'end';
}

export function relativeSize(pixels: number) {
  return `${pixels / 16}rem`;
}
