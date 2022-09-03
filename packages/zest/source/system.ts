export type PixelValue = `@px@${number}`;

export function Pixels(num: number): PixelValue {
  return `@px@${num}` as any;
}

Pixels.test = (value: unknown): value is PixelValue =>
  typeof value === 'string' && value.startsWith('@px@');

Pixels.parse = (value: PixelValue): number =>
  Number.parseInt(value.substring(4), 10);

export type KeywordValue<T extends string = string> = `@kw@${T}`;

export function Keyword<T extends string>(value: T): KeywordValue<T> {
  return `@kw@${value}` as any;
}

Keyword.test = <T extends string = string>(
  value: unknown,
): value is KeywordValue<T> =>
  typeof value === 'string' && value.startsWith('@kw@');

Keyword.parse = <T extends string = string>(value: KeywordValue<T>): T =>
  value.substring(4) as T;

export type SpacingKeyword =
  | 'none'
  | 'tiny'
  | 'small'
  | 'base'
  | 'large'
  | 'huge';
export type BorderKeyword = 'none' | 'base' | 'emphasized' | 'subdued';
export type CornerRadiusKeyword = 'none' | 'base' | 'concentric';
export type BackgroundKeyword = 'none' | 'base' | 'emphasized' | 'subdued';

export interface Position {
  type: 'relative' | 'absolute';
  block?: 'start' | 'center' | 'end';
  inline?: 'start' | 'center' | 'end';
}

export function relativeSize(pixels: number) {
  return `${pixels / 16}rem`;
}
