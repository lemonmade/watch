import type {CSSProperties, HTMLAttributes} from 'react';
import {classes, variation} from '@lemon/css';

import {
  Pixels,
  Keyword,
  relativeSize,
  type Position,
  type PixelValue,
  type KeywordValue,
  type SpacingKeyword,
  type BackgroundKeyword,
  type BorderKeyword,
  type CornerRadiusKeyword,
} from '../../system';

import styles from './View.module.css';

export interface Props {
  className?: string;
  display?: 'block' | 'grid' | 'inline';
  padding?:
    | boolean
    | number
    | SpacingKeyword
    | PixelValue
    | KeywordValue<SpacingKeyword>;
  visibility?: 'hidden' | 'visible';
  accessibilityVisibility?: 'hidden' | 'visible';

  position?: Position | Position['type'];
  border?: boolean | BorderKeyword | KeywordValue<BorderKeyword>;
  background?:
    | boolean
    | BackgroundKeyword
    | KeywordValue<BackgroundKeyword>
    | string;
  cornerRadius?:
    | number
    | boolean
    | CornerRadiusKeyword
    | KeywordValue<CornerRadiusKeyword>;
}

const BACKGROUND_CLASS_MAP = new Map<string, string | false>([
  [Keyword<BackgroundKeyword>('none'), false],
  [Keyword<BackgroundKeyword>('subdued'), styles.backgroundSubdued],
  [Keyword<BackgroundKeyword>('base'), styles.backgroundBase],
  [Keyword<BackgroundKeyword>('emphasized'), styles.backgroundEmphasized],
] as [string, string | false][]);

const PADDING_CLASS_MAP = new Map<string, string | false>([
  [Keyword<SpacingKeyword>('none'), false],
  [Keyword<SpacingKeyword>('tiny'), styles.paddingTiny],
  [Keyword<SpacingKeyword>('small'), styles.paddingSmall],
  [Keyword<SpacingKeyword>('base'), styles.paddingBase],
  [Keyword<SpacingKeyword>('large'), styles.paddingLarge],
  [Keyword<SpacingKeyword>('huge'), styles.paddingHuge],
] as [string, string | false][]);

const BORDER_CLASS_MAP = new Map<string, string | false>([
  [Keyword<BorderKeyword>('none'), false],
  [Keyword<BorderKeyword>('subdued'), styles.borderSubdued],
  [Keyword<BorderKeyword>('base'), styles.borderBase],
  [Keyword<BorderKeyword>('emphasized'), styles.borderEmphasized],
] as [string, string | false][]);

const CORNER_RADIUS_CLASS_MAP = new Map<string, string | false>([
  [Keyword<CornerRadiusKeyword>('none'), false],
  [Keyword<CornerRadiusKeyword>('base'), styles.cornerRadiusBase],
  [Keyword<CornerRadiusKeyword>('concentric'), styles.cornerRadiusConcentric],
] as [string, string | false][]);

export interface DOMPropController {
  readonly styles: CSSProperties | undefined;
  readonly className: string;
  readonly attributes: Omit<HTMLAttributes<any>, 'styles'>;
  addStyles(styles: CSSProperties | Record<string, any>): void;
  addClassName(...classNames: (string | undefined | null | false)[]): void;
  addAttributes(attributes: Omit<HTMLAttributes<any>, 'styles'>): void;
}

export function resolveViewProps({
  styles,
  className,
  attributes,
}: DOMPropController) {
  return attributes
    ? {...attributes, style: styles, className}
    : {style: styles, className};
}

export function useViewProps({
  className: starterClassName,
  display,
  position,
  padding,
  background,
  border,
  cornerRadius,
  visibility,
  accessibilityVisibility,
}: Props = {}): DOMPropController {
  let className = classes(styles.View!, starterClassName);
  let domStyles: DOMPropController['styles'];
  let attributes: DOMPropController['attributes'];

  const addStyles: DOMPropController['addStyles'] = (newStyles) => {
    if (domStyles == null) domStyles = {};
    Object.assign(domStyles, newStyles);
  };

  const addClassName: DOMPropController['addClassName'] = (
    ...newClassNames
  ) => {
    for (const newClassName of newClassNames) {
      if (!newClassName) continue;
      if (className.length > 0) className += ' ';
      className += newClassName;
    }
  };

  const addAttributes: DOMPropController['addAttributes'] = (newAttributes) => {
    if (attributes == null) attributes = {};
    Object.assign(attributes, newAttributes);
  };

  if (display) {
    addClassName(styles[variation('display', display)]);
  }

  if (visibility === 'hidden') {
    addClassName(
      styles[
        variation(
          'visibility',
          accessibilityVisibility === 'visible' ? 'visuallyHidden' : 'hidden',
        )
      ],
    );
  }

  if (padding) {
    let normalizedPadding: PixelValue | KeywordValue<SpacingKeyword>;

    if (typeof padding === 'boolean') {
      normalizedPadding = Keyword<SpacingKeyword>('base');
    } else if (typeof padding === 'number') {
      normalizedPadding = Pixels(padding);
    } else if (Keyword.test(padding) || Pixels.test(padding)) {
      normalizedPadding = padding;
    } else {
      normalizedPadding = Keyword<SpacingKeyword>(padding);
    }

    const systemClassName = PADDING_CLASS_MAP.get(normalizedPadding);

    if (systemClassName) {
      addClassName(systemClassName);
    } else {
      addStyles({
        padding: relativeSize(Pixels.parse(normalizedPadding as PixelValue)),
      });
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
      normalizedBorder = border as any;
    } else {
      normalizedBorder = Keyword(border) as any;
    }

    const systemClassName = BORDER_CLASS_MAP.get(normalizedBorder);

    if (systemClassName) addClassName(systemClassName);
  }

  if (background) {
    let normalizedBackground: KeywordValue<BackgroundKeyword>;

    if (typeof background === 'boolean') {
      normalizedBackground = Keyword('base');
    } else if (Keyword.test(background)) {
      normalizedBackground = background as any;
    } else {
      normalizedBackground = Keyword(background) as any;
    }

    const systemClassName = BACKGROUND_CLASS_MAP.get(normalizedBackground);

    if (systemClassName) {
      addClassName(systemClassName);
    } else {
      addStyles({backgroundColor: background});
    }
  }

  if (typeof cornerRadius === 'number') {
    const radius = relativeSize(cornerRadius);
    addStyles({
      '--z-container-corner-radius': radius,
      borderRadius: radius,
    });
  } else if (cornerRadius) {
    let normalizedCornerRadius: KeywordValue<BackgroundKeyword>;

    if (typeof cornerRadius === 'boolean') {
      normalizedCornerRadius = Keyword('base');
    } else if (Keyword.test(cornerRadius)) {
      normalizedCornerRadius = cornerRadius as any;
    } else {
      normalizedCornerRadius = Keyword(cornerRadius) as any;
    }

    const systemClassName = CORNER_RADIUS_CLASS_MAP.get(normalizedCornerRadius);

    if (systemClassName) {
      addClassName(systemClassName);
    } else {
      addStyles({borderRadius: cornerRadius});
    }
  }

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
    addClassName(styles.cornerRadiusConcentric);
  }

  return {
    get styles() {
      return domStyles;
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
