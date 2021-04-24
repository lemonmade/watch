import type {PropsWithChildren} from 'react';

import {
  Pixels,
  Keyword,
  useDomProps,
  relativeSize,
  toProps,
} from '../../system';
import type {
  PixelValue,
  SpacingKeyword,
  KeywordValue,
  SystemProps,
} from '../../system';

import styles from './BlockStack.css';

interface Props extends SystemProps {
  spacing?: SpacingKeyword | KeywordValue<SpacingKeyword>;
}

const SPACING_CLASS_MAP = new Map<string, string | false>([
  [Keyword<SpacingKeyword>('none'), styles.spacingNone],
  [Keyword<SpacingKeyword>('small'), styles.spacingSmall],
  [Keyword<SpacingKeyword>('base'), false],
  [Keyword<SpacingKeyword>('large'), styles.spacingLarge],
]);

export function BlockStack({
  spacing,
  children,
  ...systemProps
}: PropsWithChildren<Props>) {
  const dom = useDomProps({...systemProps, display: 'grid'});
  dom.addClassName(styles.BlockStack);

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
      dom.addStyles({
        gap: relativeSize(Pixels.parse(normalizedSpacing as PixelValue)),
      });
    } else if (systemClassName) {
      dom.addClassName(systemClassName);
    }
  }

  return <div {...toProps(dom)}>{children}</div>;
}
