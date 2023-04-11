import type {SpacingKeyword as ClipsSpacingKeyword} from '@watching/clips';

export type RawValue = `@raw@${any}`;

export function raw(strings: TemplateStringsArray, ...values: any[]): RawValue {
  let result = '';

  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += values[i];
    }
  }

  return `@raw@${result}`;
}

raw.test = (value: unknown): value is RawValue =>
  typeof value === 'string' && value.startsWith('@raw@');

raw.parse = (value: RawValue): string => value.slice(5);

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
