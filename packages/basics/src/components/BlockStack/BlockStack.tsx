import type {PropsWithChildren} from 'react';

import {relativeSize} from '../../utilities/css';

import {Pixels, Keyword} from '../../system';
import type {PixelValue, SpacingKeyword, KeywordValue} from '../../system';

import {ViewInternal} from '../ViewInternal';
import type {ViewInternalProps} from '../ViewInternal';

import styles from './BlockStack.css';

interface Props
  extends Pick<ViewInternalProps, 'padding' | 'accessibilityVisibility'> {
  spacing?: SpacingKeyword | KeywordValue<SpacingKeyword>;
}

const SPACING_CLASS_MAP = new Map<string, string | false>([
  [Keyword<SpacingKeyword>('none'), styles.spacingNone],
  [Keyword<SpacingKeyword>('small'), styles.spacingSmall],
  [Keyword<SpacingKeyword>('base'), false],
  [Keyword<SpacingKeyword>('large'), styles.spacingLarge],
]);

export function BlockStack({
  children,
  padding,
  spacing,
  accessibilityVisibility,
}: PropsWithChildren<Props>) {
  let className = styles.BlockStack;
  const appendClassName = (
    newClassNames: string | undefined | null | false,
  ) => {
    if (!newClassNames) return;
    if (className.length > 0) className += ' ';
    className += newClassNames;
  };

  const extraStyles: Record<string, any> = {};

  if (spacing != null) {
    let normalizedSpacing: PixelValue | KeywordValue<SpacingKeyword>;

    if (typeof spacing === 'number') {
      normalizedSpacing = Pixels(spacing);
    } else if (spacing.startsWith('@')) {
      normalizedSpacing = spacing as any;
    } else {
      normalizedSpacing = Keyword(spacing as SpacingKeyword);
    }

    const systemClassName = SPACING_CLASS_MAP.get(normalizedSpacing);

    if (systemClassName == null) {
      extraStyles.gap = relativeSize(
        Pixels.parse(normalizedSpacing as PixelValue),
      );
    } else if (systemClassName) {
      appendClassName(systemClassName);
    }
  }

  return (
    <ViewInternal
      cssDisplay="grid"
      cssClass={className}
      cssStyles={extraStyles}
      padding={padding}
      accessibilityVisibility={accessibilityVisibility}
    >
      {children}
    </ViewInternal>
  );
}
