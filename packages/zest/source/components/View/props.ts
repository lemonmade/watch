import type {CSSProperties, HTMLAttributes} from 'react';
import {classes, variation} from '@lemon/css';

import {
  raw,
  relativeSize,
  type RawValue,
  type Position,
  type SpacingKeyword,
  type BackgroundKeyword,
  type BorderKeyword,
  type CornerRadiusKeyword,
} from '../../system';
import systemStyles from '../../system.module.css';

import styles from './View.module.css';

export interface Props {
  id?: string;
  className?: string;
  display?: 'block' | 'inline' | 'flex' | 'inlineFlex' | 'grid' | 'inlineGrid';
  padding?: boolean | SpacingKeyword | RawValue;
  visibility?: 'hidden' | 'visible';
  accessibilityVisibility?: 'hidden' | 'visible';

  position?: Position | Position['type'];
  border?: boolean | BorderKeyword | RawValue;
  background?: boolean | BackgroundKeyword | RawValue;
  cornerRadius?: boolean | CornerRadiusKeyword | RawValue;
}

const BACKGROUND_CLASS_MAP = new Map<BackgroundKeyword, string | false>([
  ['none', false],
  ['subdued', styles.backgroundSubdued],
  ['base', styles.backgroundBase],
  ['emphasized', styles.backgroundEmphasized],
] as [BackgroundKeyword, string | false][]);

const PADDING_CLASS_MAP = new Map<SpacingKeyword, string | false>([
  ['none', false],
  ['tiny', styles.paddingTiny],
  ['small', styles.paddingSmall],
  ['base', styles.paddingBase],
  ['large', styles.paddingLarge],
  ['huge', styles.paddingHuge],
] as [SpacingKeyword, string | false][]);

const BORDER_CLASS_MAP = new Map<BorderKeyword, string | false>([
  ['none', false],
  ['subdued', styles.borderSubdued],
  ['base', styles.borderBase],
  ['emphasized', styles.borderEmphasized],
] as [BorderKeyword, string | false][]);

const CORNER_RADIUS_CLASS_MAP = new Map<CornerRadiusKeyword, string | false>([
  ['none', false],
  ['base', styles.cornerRadiusBase],
  ['concentric', styles.cornerRadiusConcentric],
] as [CornerRadiusKeyword, string | false][]);

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
  id,
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

  if (id) {
    addAttributes({id});
  }

  if (display) {
    addClassName(systemStyles[variation('display', display)]);
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

  if (raw.test(padding)) {
    addStyles({padding: raw.parse(padding)});
  } else if (padding) {
    let normalizedPadding: SpacingKeyword;

    if (typeof padding === 'boolean') {
      normalizedPadding = 'base';
    } else {
      normalizedPadding = padding;
    }

    const systemClassName = PADDING_CLASS_MAP.get(normalizedPadding);
    addClassName(systemClassName);
  }

  if (accessibilityVisibility === 'hidden' && visibility !== 'hidden') {
    addAttributes({'aria-hidden': true});
  }

  if (raw.test(border)) {
    addStyles({border: raw.parse(border)});
  } else if (border) {
    let normalizedBorder: BorderKeyword;

    if (typeof border === 'boolean') {
      normalizedBorder = 'base';
    } else {
      normalizedBorder = border;
    }

    const systemClassName = BORDER_CLASS_MAP.get(normalizedBorder);
    addClassName(systemClassName);
  }

  if (raw.test(background)) {
    addStyles({background: raw.parse(background)});
  } else if (background) {
    let normalizedBackground: BackgroundKeyword;

    if (typeof background === 'boolean') {
      normalizedBackground = 'base';
    } else {
      normalizedBackground = background;
    }

    const systemClassName = BACKGROUND_CLASS_MAP.get(normalizedBackground);

    if (systemClassName) {
      addClassName(systemClassName);
    } else {
      addStyles({backgroundColor: background});
    }
  }

  if (raw.test(cornerRadius)) {
    const radius = raw.parse(cornerRadius);
    addStyles({
      '--z-container-corner-radius': radius,
      borderRadius: radius,
    });
  } else if (cornerRadius) {
    let normalizedCornerRadius: CornerRadiusKeyword;

    if (typeof cornerRadius === 'boolean') {
      normalizedCornerRadius = 'base';
    } else {
      normalizedCornerRadius = cornerRadius;
    }

    const systemClassName = CORNER_RADIUS_CLASS_MAP.get(normalizedCornerRadius);
    addClassName(systemClassName);
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
