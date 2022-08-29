import type {CSSProperties, HTMLAttributes} from 'react';
import {variation} from '@lemon/css';

import systemStyles from './system.module.css';

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
export type BorderKeyword = 'none' | 'base' | 'subdued';

export interface Position {
  type: 'relative' | 'absolute';
  block?: 'start' | 'center' | 'end';
  inline?: 'start' | 'center' | 'end';
}

export interface SystemProps {
  padding?: number | SpacingKeyword | PixelValue | KeywordValue<SpacingKeyword>;
  visibility?: 'hidden' | 'visible';
  accessibilityVisibility?: 'hidden' | 'visible';

  position?: Position | Position['type'];
  border?: boolean | BorderKeyword | KeywordValue<BorderKeyword>;
  background?: string;
  cornerRadius?: number | 'concentric';
}

const PADDING_CLASS_MAP = new Map<string, string | false>([
  [Keyword<SpacingKeyword>('none'), false],
  [Keyword<SpacingKeyword>('small'), systemStyles.paddingSmall],
  [Keyword<SpacingKeyword>('base'), systemStyles.paddingBase],
  [Keyword<SpacingKeyword>('large'), systemStyles.paddingLarge],
] as [string, string | false][]);

const BORDER_CLASS_MAP = new Map<string, string | false>([
  [Keyword<BorderKeyword>('none'), false],
  [Keyword<BorderKeyword>('subdued'), systemStyles.borderSubdued],
  [Keyword<BorderKeyword>('base'), systemStyles.borderBase],
] as [string, string | false][]);

interface SystemDomProps {
  readonly styles: CSSProperties | undefined;
  readonly className: string;
  readonly attributes: Omit<HTMLAttributes<any>, 'styles'>;
  addStyles(styles: CSSProperties | Record<string, any>): void;
  addClassName(...classNames: (string | undefined | null | false)[]): void;
  addAttributes(attributes: Omit<HTMLAttributes<any>, 'styles'>): void;
}

export function toProps({styles, className, attributes}: SystemDomProps) {
  return attributes
    ? {...attributes, style: styles, className}
    : {style: styles, className};
}

export function useDomProps({
  display,
  position,
  padding,
  background,
  border,
  cornerRadius,
  visibility,
  accessibilityVisibility,
}: SystemProps & {display?: 'block' | 'grid' | 'inline'} = {}): SystemDomProps {
  let className = systemStyles.View!;
  let styles: SystemDomProps['styles'];
  let attributes: SystemDomProps['attributes'];

  const addStyles: SystemDomProps['addStyles'] = (newStyles) => {
    if (styles == null) styles = {};
    Object.assign(styles, newStyles);
  };

  const addClassName: SystemDomProps['addClassName'] = (...newClassNames) => {
    for (const newClassName of newClassNames) {
      if (!newClassName) continue;
      if (className.length > 0) className += ' ';
      className += newClassName;
    }
  };

  const addAttributes: SystemDomProps['addAttributes'] = (newAttributes) => {
    if (attributes == null) attributes = {};
    Object.assign(attributes, newAttributes);
  };

  if (display) {
    addClassName(systemStyles[variation('display', display)]);
  }

  if (visibility === 'hidden') {
    addClassName(
      systemStyles[
        variation(
          'visibility',
          accessibilityVisibility === 'visible' ? 'visuallyHidden' : 'hidden',
        )
      ],
    );
  }

  if (padding != null) {
    let normalizedPadding: PixelValue | KeywordValue<SpacingKeyword>;

    if (typeof padding === 'number') {
      normalizedPadding = Pixels(padding);
    } else if (Keyword.test(padding) || Pixels.test(padding)) {
      normalizedPadding = padding;
    } else {
      normalizedPadding = Keyword<SpacingKeyword>(padding);
    }

    const systemClassName = PADDING_CLASS_MAP.get(normalizedPadding);

    if (systemClassName == null) {
      addStyles({
        padding: relativeSize(Pixels.parse(normalizedPadding as PixelValue)),
      });
    } else if (systemClassName) {
      addClassName(systemClassName);
    }
  }

  if (accessibilityVisibility === 'hidden' && visibility !== 'hidden') {
    addAttributes({'aria-hidden': true});
  }

  if (border) {
    let normalizedBorder: KeywordValue<BorderKeyword>;

    if (typeof border === 'boolean') {
      normalizedBorder = Keyword('base');
    } else if (Keyword.test(border)) {
      normalizedBorder = border;
    } else {
      normalizedBorder = Keyword(border);
    }

    const systemClassName = BORDER_CLASS_MAP.get(normalizedBorder);

    if (systemClassName) addClassName(systemClassName);
  }

  addStyles({backgroundColor: background});

  // concentric border radius is handled with a class
  if (typeof cornerRadius === 'number') {
    const radius = relativeSize(cornerRadius);
    addStyles({
      '--z-container-corner-radius': radius,
      borderRadius: radius,
    });
  }

  if (position) {
    if (typeof position === 'string') {
      addStyles({position});
    } else {
      const {type, block, inline} = position;
      addStyles({position: type});

      if (inline) {
        switch (inline) {
          case 'start': {
            addStyles({left: 0});
            break;
          }
          case 'center': {
            addStyles({
              left: 0,
              right: 0,
              marginLeft: 'auto',
              marginRight: 'auto',
            });
            break;
          }
          case 'end': {
            addStyles({right: 0});
            break;
          }
        }
      }

      if (block) {
        switch (block) {
          case 'start': {
            addStyles({top: 0});
            break;
          }
          case 'center': {
            addStyles({
              top: 0,
              bottom: 0,
              marginTop: 'auto',
              marginBottom: 'auto',
            });
            break;
          }
          case 'end': {
            addStyles({bottom: 0});
            break;
          }
        }
      }
    }
  }

  if (cornerRadius === 'concentric') {
    addClassName(systemStyles.cornerRadiusConcentric);
  }

  return {
    get styles() {
      return styles;
    },
    get className() {
      return className;
    },
    get attributes() {
      return attributes;
    },
    addStyles,
    addClassName,
    addAttributes,
  };
}

export function relativeSize(pixels: number) {
  return `${pixels / 16}rem`;
}

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
