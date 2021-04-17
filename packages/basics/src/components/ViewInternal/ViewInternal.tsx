import type {CSSProperties, PropsWithChildren} from 'react';
import {variation} from '@lemon/css';

import {relativeSize} from '../../utilities/css';

import {Pixels, Keyword} from '../../system';
import type {PixelValue, SpacingKeyword, KeywordValue} from '../../system';

import styles from './ViewInternal.css';

export interface Props {
  padding?: number | SpacingKeyword | PixelValue | KeywordValue<SpacingKeyword>;
  accessibilityRole?: 'section';

  visibility?: 'hidden' | 'visible';
  accessibilityVisibility?: 'hidden' | 'visible';

  // position?: Position | Position['type'];
  // border?: string;
  // background?: string;
  // cornerRadius?: number | 'concentric';

  // Internals...
  cssClass?: string;
  cssDisplay?: 'block' | 'grid';
  cssStyles?: CSSProperties;
}

const PADDING_CLASS_MAP = new Map<string, string | false>([
  [Keyword<SpacingKeyword>('none'), false],
  [Keyword<SpacingKeyword>('small'), styles.paddingSmall],
  [Keyword<SpacingKeyword>('base'), styles.paddingBase],
  [Keyword<SpacingKeyword>('large'), styles.paddingLarge],
]);

export function ViewInternal({
  children,
  padding,
  accessibilityRole,
  visibility,
  accessibilityVisibility,
  cssClass,
  cssDisplay,
  cssStyles,
}: PropsWithChildren<Props>) {
  const Element = accessibilityRole === 'section' ? 'section' : 'div';

  let className =
    cssClass && cssClass.length > 0
      ? `${styles.View} ${cssClass}`
      : styles.View;

  const appendClassName = (
    newClassNames: string | undefined | null | false,
  ) => {
    if (!newClassNames) return;
    if (className.length > 0) className += ' ';
    className += newClassNames;
  };

  const extraStyles: Record<string, any> = {...cssStyles};

  if (cssDisplay) {
    appendClassName(styles[variation('display', cssDisplay)]);
  }

  if (visibility === 'hidden') {
    appendClassName(
      styles[
        variation(
          'visibility',
          accessibilityVisibility === 'visible' ? 'visuallyHidden' : 'hidden',
        )
      ],
    );
  }

  if (padding != null) {
    let normalizedPadding: PixelValue | KeywordValue;

    if (typeof padding === 'number') {
      normalizedPadding = Pixels(padding);
    } else if (padding.startsWith('@')) {
      normalizedPadding = padding as any;
    } else {
      normalizedPadding = Keyword(padding as SpacingKeyword);
    }

    const systemClassName = PADDING_CLASS_MAP.get(normalizedPadding);

    if (systemClassName == null) {
      extraStyles.padding = relativeSize(
        Pixels.parse(normalizedPadding as PixelValue),
      );
    } else if (systemClassName) {
      appendClassName(systemClassName);
    }
  }

  return (
    <Element
      className={className}
      style={extraStyles}
      aria-hidden={accessibilityVisibility === 'hidden' || undefined}
    >
      {children}
    </Element>
  );
}
