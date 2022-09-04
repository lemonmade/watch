import type {PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';

import {useUniqueId} from '../../utilities/id';
import {raw, type SpacingKeyword, type RawValue} from '../../system';

import {View, type ViewProps} from '../View';

import styles from './Layout.module.css';

export type Size = 'auto' | 'fill' | 'hidden' | false | RawValue;
export type ViewportSize = 'small' | 'medium' | 'large';

export interface ViewportMedia {
  readonly min?: ViewportSize;
  readonly max?: ViewportSize;
}

export interface Media<T> {
  readonly value: T;
  readonly viewport?: ViewportMedia;
}

// type PixelValue = `@px@${number}`;

// function Pixels(num: number): PixelValue {
//   return `@px@${num}` as any;
// }

// type PercentValue = `@%@${number}`;

// function Percent(num: number): PercentValue {
//   return `@%@${num}` as any;
// }

// type KeywordValue<T extends string = string> = `@n@${T}`;

// function Keyword<T extends string>(value: T): KeywordValue<T> {
//   return `@k@${value}` as any;
// }

// type UnknownValue<T extends string | number | boolean> = `@u@${T}`;

// function Unknown<T extends string | number | boolean>(value: T): UnknownValue<T> {
//   return `@u@${value}` as any;
// }

// type Unset = '';

// type ViewportSizeCondition = `@v@${KeywordValue<ViewportSize> | Unset}_${KeywordValue<ViewportSize | Unset>}`;

// function ViewportSize({min, max}: {
//   readonly min?: ViewportSize;
//   readonly max?: ViewportSize;
// }): ViewportSizeCondition {
//    return `@vc@${min ? Keyword(min) : ''}_${max ? Keyword(max) : ''}` as any;
// }

// type InteractionStateMode = 'hover' | 'active' | 'focused';
// type InteractionStateCondition = `@i@${InteractionStateMode}`

// function InteractionState(value: InteractionStateMode): InteractionStateCondition {
//   return `@i@${value}` as any;
// }

// type DynamicValueAllowedConditions = ViewportSizeCondition | InteractionStateCondition;

// type DynamicValue<Value extends string | number | boolean, Condition extends DynamicValueAllowedConditions> = `@dv@${Value & string}_${Condition}`;

// function isStyleValue(value: unknown) {
//   return typeof value === 'string' && value[0] === '@';
// }

// function DynamicValue<
//   Value extends string | number | boolean,
//   Condition extends DynamicValueAllowedConditions
// >(
//   value: Value,
//   {when: condition}: {when: Condition},
// ): DynamicValue<Value, Condition> {
//   return `@dv@${
//     isStyleValue(value) ? value : Unknown(value)
//   }_${condition}` as any;
// }

// type ValueOrDynamicValueList<Value extends string | number | boolean> = Value | [Value | DynamicValue<Value, DynamicValueAllowedConditions>, ...DynamicValue<Value, DynamicValueAllowedConditions>[]];

// type SizeKeyword = 'auto' | 'fill' | 'hidden';
// type AllowedSize = SizeKeyword | false | number | KeywordValue<SizeKeyword> | PixelValue | PercentValue;

// function parseType<ParsedType, AllowedType extends ParsedType>(type: AllowedType): ParsedType {

// }

// const sizes: ValueOrDynamicValueList<AllowedSize> = [
//   'fill',
//   DynamicValue(Pixels(300), {when: InteractionState('hover')}),
//   DynamicValue(Pixels(123), {when: ViewportSize({min: 'medium'})}),
//   DynamicValue(Percent(20), {when: ViewportSize({min: 'large'})}),
// ];

export type ValueOrMediaList<T> = T | Media<T>[];

interface Props extends Omit<ViewProps, 'display'> {
  inlineAlignment?: 'leading' | 'trailing';
  blockAlignment?: 'center' | 'trailing';
  columns?: ValueOrMediaList<Size[]>;
  spacing?: boolean | SpacingKeyword;
}

// In ems, need to make configurable
const MEDIAQUERY_MAP: Map<ViewportSize, number> = new Map([
  ['small', 32],
  ['medium', 50],
  ['large', 70],
]);

const SPACING_CLASS_MAP = new Map<SpacingKeyword, string | boolean>([
  ['none', false],
  ['tiny', styles.spacingTiny],
  ['small', styles.spacingSmall],
  ['base', styles.spacingBase],
  ['large', styles.spacingLarge],
  ['huge', styles.spacingHuge],
] as [SpacingKeyword, string | boolean][]);

export function Layout({
  inlineAlignment,
  blockAlignment,
  columns = ['auto'],
  spacing,
  children,
  ...rest
}: PropsWithChildren<Props>) {
  const id = useUniqueId('Layout');

  const className = classes(
    styles.Layout,
    blockAlignment && styles[variation('blockAlignment', blockAlignment)],
    inlineAlignment && styles[variation('inlineAlignment', inlineAlignment)],
    spacing &&
      SPACING_CLASS_MAP.get(typeof spacing === 'boolean' ? 'base' : spacing),
  );

  return (
    <>
      <ColumnsStyles scope={id} columns={columns} />
      <View id={id} className={className} {...rest} display="grid">
        {children}
      </View>
    </>
  );
}

function ColumnsStyles({
  scope,
  columns,
}: {
  scope: string;
  columns: NonNullable<Props['columns']>;
}) {
  const rootSelector = `#${scope}`;

  return (
    <style>
      {Array.from(normalizeMaybeMediaList(columns))
        .map(({viewport, value}) =>
          viewport
            ? wrapViewportMedia(viewport, sizesToSelectors(rootSelector, value))
            : sizesToSelectors(rootSelector, value),
        )
        .join('\n')}
    </style>
  );
}

function wrapViewportMedia({min, max}: ViewportMedia, content: string) {
  let selector: string;

  const minEms = min && getMinimum(min);
  const maxEms = max && getMaximum(max);

  if (!minEms && !maxEms) {
    return content;
  }

  if (minEms && maxEms) {
    selector = `(min-width: ${minEms}em, max-width: ${maxEms}em)`;
  } else if (maxEms) {
    selector = `(max-width: ${maxEms}em)`;
  } else {
    selector = `(min-width: ${minEms}em)`;
  }

  return `@media all and ${selector} {\n${content}\n}`;
}

function getMinimum(value: ViewportSize) {
  switch (value) {
    case 'small':
      return 0;
    case 'medium':
      return MEDIAQUERY_MAP.get('small')!;
    case 'large':
      return MEDIAQUERY_MAP.get('medium')!;
  }
}

function getMaximum(value: ViewportSize) {
  return MEDIAQUERY_MAP.get(value)! - 0.001;
}

function sizesToSelectors(root: string, sizes: Size[]) {
  const columns: string[] = [];
  const rules: string[] = [];

  for (const [index, size] of sizes.entries()) {
    if (!size || size === 'hidden') {
      rules.push(
        `:where(${root}) > :where(:nth-child(${
          index + 1
        })) { --x-implicit-display-none: none; }`,
      );
      continue;
    }

    if (raw.test(size)) {
      columns.push(raw.parse(size));
      rules.push(
        `:where(${root}) > :nth-child(${
          index + 1
        }) { --x-implicit-display-none: initial; --x-implicit-display-block: block; --x-implicit-display-flex: flex; --x-implicit-display-grid: grid; --x-implicit-container-inline-size: initial; }`,
      );
    } else if (size === 'auto') {
      columns.push('auto');
      rules.push(
        `:where(${root}) > :nth-child(${
          index + 1
        }) { --x-implicit-display-none: initial; --x-implicit-display-block: initial; --z-implicit-display-flex: initial; --z-implicit-display-grid: initial; --x-implicit-container-inline-size: initial; }`,
      );
    } else if (size === 'fill') {
      columns.push('minmax(0, 1fr)');
      rules.push(
        `:where(${root}) > :nth-child(${
          index + 1
        }) { --x-implicit-display-none: initial; --x-implicit-display-block: block; --x-implicit-display-flex: flex; --x-implicit-display-grid: grid; --x-implicit-container-inline-size: 100%; }`,
      );
    }
  }

  return `${root} { grid-template-columns: ${columns.join(
    ' ',
  )}; }\n${rules.join('\n')}`;
}

function* normalizeMaybeMediaList<T>(maybeMediaList: ValueOrMediaList<T>) {
  if (Array.isArray(maybeMediaList)) {
    if (maybeMediaList.length === 0) return;
    if (typeof maybeMediaList[0] === 'object' && 'value' in maybeMediaList[0]) {
      yield* (maybeMediaList as Media<T>[])[Symbol.iterator]();
    } else {
      yield {value: maybeMediaList as any} as Media<T>;
    }
  } else {
    yield {value: maybeMediaList} as Media<T>;
  }
}
