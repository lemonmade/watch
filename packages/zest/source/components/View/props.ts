import type {JSX} from 'preact';
import {variation} from '@lemon/css';

import {
  relativeSize,
  type Position,
  type CSSLiteralValue,
  type SpacingKeyword,
  type BackgroundKeyword,
  type BorderKeyword,
  type CornerRadiusKeyword,
  type AlignKeyword,
  CSSLiteral,
} from '../../system.ts';
import systemStyles from '../../system.module.css';

import styles from './View.module.css';

export interface ViewProps {
  id?: string;
  className?: string;
  style?: JSX.CSSProperties;
  inert?: boolean;
  display?: 'block' | 'inline' | 'flex' | 'inlineFlex' | 'grid' | 'inlineGrid';
  padding?: boolean | SpacingKeyword | CSSLiteralValue;
  paddingInlineStart?: boolean | SpacingKeyword | CSSLiteralValue;
  paddingInlineEnd?: boolean | SpacingKeyword | CSSLiteralValue;
  paddingBlockStart?: boolean | SpacingKeyword | CSSLiteralValue;
  paddingBlockEnd?: boolean | SpacingKeyword | CSSLiteralValue;
  visibility?: 'hidden' | 'visible';
  accessibilityVisibility?: 'hidden' | 'visible';

  position?: Position | Position['type'];
  border?: boolean | BorderKeyword | CSSLiteralValue;
  background?: boolean | BackgroundKeyword | CSSLiteralValue;
  cornerRadius?: boolean | CornerRadiusKeyword | CSSLiteralValue;

  alignment?: AlignKeyword | 'reset';
  inlineAlignment?: AlignKeyword | 'reset';
  blockAlignment?: AlignKeyword | 'reset';

  inlineSize?: CSSLiteralValue;
  blockSize?: CSSLiteralValue;
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
  ['small.2', styles.paddingSmall2],
  ['small.1', styles.paddingSmall1],
  ['small', styles.paddingSmall],
  ['base', styles.paddingBase],
  ['large', styles.paddingLarge],
  ['large.1', styles.paddingLarge1],
  ['large.2', styles.paddingLarge2],
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
  readonly styles: JSX.CSSProperties | undefined;
  readonly className: string;
  readonly attributes: Omit<JSX.HTMLAttributes<any>, 'styles'>;
  addStyles(styles: JSX.CSSProperties | Record<string, any>): void;
  addClassName(...classNames: (string | undefined | null | false)[]): void;
  addAttributes(attributes: Omit<JSX.HTMLAttributes<any>, 'styles'>): void;
}

export function resolveViewProps({
  styles,
  className,
  attributes,
}: DOMPropController): JSX.HTMLAttributes<any> {
  return attributes
    ? {...attributes, style: styles, className}
    : {style: styles, className};
}

export function useViewProps({
  id,
  style: explicitStyle,
  className: explicitClassName,
  inert,
  display,
  position,
  padding,
  paddingInlineStart,
  paddingInlineEnd,
  paddingBlockStart,
  paddingBlockEnd,
  background,
  border,
  cornerRadius,
  visibility,
  accessibilityVisibility,
  inlineSize,
  blockSize,
  alignment,
  inlineAlignment,
  blockAlignment,
}: ViewProps = {}): DOMPropController {
  let className = styles.View!;
  let domStyles: DOMPropController['styles'] = explicitStyle;
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

  const handlePadding = (
    padding: ViewProps['padding'],
    side?: 'inlineStart' | 'inlineEnd' | 'blockStart' | 'blockEnd',
  ) => {
    if (padding == null) return;

    if (CSSLiteral.test(padding)) {
      addStyles({padding: CSSLiteral.parse(padding)});
    } else {
      let normalizedPadding: string;

      if (padding === true) {
        normalizedPadding = 'base';
      } else if (padding === false) {
        normalizedPadding = 'none';
      } else {
        normalizedPadding = padding.replace('.', '');

        if (
          normalizedPadding.endsWith('small') ||
          normalizedPadding.endsWith('large')
        ) {
          normalizedPadding = `${normalizedPadding}1`;
        }
      }

      addClassName(
        systemStyles[
          variation(
            side ? variation('padding', side) : 'padding',
            normalizedPadding,
          )
        ],
      );
    }
  };

  if (inert) {
    addAttributes({inert: true} as any);
  }

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

  if (inlineSize) {
    addStyles({width: CSSLiteral.parse(inlineSize)});
  }

  if (blockSize) {
    addStyles({height: CSSLiteral.parse(blockSize)});
  }

  handlePadding(padding);
  handlePadding(paddingInlineStart, 'inlineStart');
  handlePadding(paddingInlineEnd, 'inlineEnd');
  handlePadding(paddingBlockStart, 'blockStart');
  handlePadding(paddingBlockEnd, 'blockEnd');

  if (CSSLiteral.test(padding)) {
    addStyles({padding: CSSLiteral.parse(padding)});
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

  if (CSSLiteral.test(border)) {
    addStyles({border: CSSLiteral.parse(border)});
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

  if (CSSLiteral.test(background)) {
    addStyles({background: CSSLiteral.parse(background)});
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

  if (CSSLiteral.test(cornerRadius)) {
    const radius = CSSLiteral.parse(cornerRadius);
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

  if (alignment) {
    addClassName(systemStyles[variation('alignment', alignment)]);
  }

  if (inlineAlignment) {
    addClassName(systemStyles[variation('inlineAlignment', inlineAlignment)]);
  }

  if (blockAlignment) {
    addClassName(systemStyles[variation('blockAlignment', blockAlignment)]);
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

  if (explicitClassName) {
    addClassName(explicitClassName);
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
