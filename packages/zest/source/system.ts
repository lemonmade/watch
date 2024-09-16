import type {
  CSSLiteralValue,
  DynamicValue,
  StyleDynamicValue,
  SpacingKeyword as ClipsSpacingKeyword,
} from '@watching/clips/styles';

export * from '@watching/clips/styles';

export const CSSLiteral = {
  test(value: unknown): value is CSSLiteralValue {
    return typeof value === 'string' && value.startsWith('css:');
  },
  parse(value: CSSLiteralValue): string {
    return value.slice(4);
  },
};

export const DynamicStyle = {
  test<Value = unknown>(value: unknown): value is StyleDynamicValue<Value> {
    return typeof value === 'string' && value.startsWith('@@style:');
  },
  parse<Value = unknown>(value: StyleDynamicValue<Value>): DynamicValue<Value> {
    const split = value.split('@@');
    const dynamicValue: any = {};

    for (const part of split) {
      if (part.startsWith('style:')) {
        dynamicValue.value = safeJSONParse(part.slice(6));
      } else if (part.startsWith('viewport:')) {
        const viewport: any = {};
        const [min, max] = part.slice(9).split('>>');

        viewport.min = safeJSONParse(min);
        viewport.max = safeJSONParse(max);

        dynamicValue.viewport = viewport;
      }
    }

    return dynamicValue;
  },
};

function safeJSONParse(value?: string) {
  if (value == null || value.length === 0) {
    return undefined;
  }

  return JSON.parse(value);
}

export type SpacingKeyword = ClipsSpacingKeyword;
export type BorderKeyword = 'none' | 'auto' | 'emphasized' | 'subdued';
export type CornerRadiusKeyword = 'none' | 'auto' | 'concentric';
export type BackgroundKeyword = 'none' | 'auto' | 'emphasized' | 'subdued';
export type EmphasisKeyword = 'emphasized' | 'subdued';
export type EmphasisValue = EmphasisKeyword | boolean;
export type ActionRoleKeyword = 'destructive';
export type BasicAlignmentKeyword = 'start' | 'center' | 'end';
export type AlignKeyword = BasicAlignmentKeyword | 'space-between';

export interface Position {
  type: 'relative' | 'absolute';
  block?: 'start' | 'center' | 'end';
  inline?: 'start' | 'center' | 'end';
}

export function relativeSize(pixels: number) {
  return `${pixels / 16}rem`;
}
