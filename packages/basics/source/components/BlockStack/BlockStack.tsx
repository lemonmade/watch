import type {PropsWithChildren} from 'react';
import {variation} from '@lemon/css';

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

import styles from './BlockStack.module.css';

export type AlignKeyword = 'start' | 'end' | 'center' | 'stretch';

interface Props extends SystemProps {
  spacing?: boolean | SpacingKeyword | KeywordValue<SpacingKeyword>;
  align?: AlignKeyword | KeywordValue<AlignKeyword>;
}

const SPACING_CLASS_MAP = new Map<string, string | false>([
  [Keyword<SpacingKeyword>('none'), styles.spacingNone],
  [Keyword<SpacingKeyword>('tiny'), styles.spacingTiny],
  [Keyword<SpacingKeyword>('small'), styles.spacingSmall],
  [Keyword<SpacingKeyword>('base'), false],
  [Keyword<SpacingKeyword>('large'), styles.spacingLarge],
  [Keyword<SpacingKeyword>('huge'), styles.spacingHuge],
] as [string, string | false][]);

export function BlockStack({
  align,
  spacing,
  children,
  ...systemProps
}: PropsWithChildren<Props>) {
  const dom = useDomProps({...systemProps, display: 'grid'});
  dom.addClassName(styles.BlockStack);

  if (align != null) {
    dom.addClassName(
      styles[
        variation('align', Keyword.test(align) ? Keyword.parse(align) : align)
      ],
    );
  }

  if (spacing != null) {
    let normalizedSpacing: PixelValue | KeywordValue<SpacingKeyword>;

    if (typeof spacing === 'boolean') {
      normalizedSpacing = Keyword(spacing ? 'base' : 'none');
    } else if (typeof spacing === 'number') {
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
