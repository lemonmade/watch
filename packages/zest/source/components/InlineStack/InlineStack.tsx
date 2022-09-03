import type {PropsWithChildren} from 'react';

import {Pixels, Keyword, relativeSize} from '../../system';
import type {PixelValue, SpacingKeyword, KeywordValue} from '../../system';

import {useViewProps, resolveViewProps, type ViewProps} from '../View';

import styles from './InlineStack.module.css';

interface Props extends Omit<ViewProps, 'display'> {
  spacing?: boolean | SpacingKeyword | KeywordValue<SpacingKeyword>;
}

const SPACING_CLASS_MAP = new Map<string, string | false>([
  [Keyword<SpacingKeyword>('none'), styles.spacingNone],
  [Keyword<SpacingKeyword>('tiny'), styles.spacingTiny],
  [Keyword<SpacingKeyword>('small'), styles.spacingSmall],
  [Keyword<SpacingKeyword>('base'), false],
  [Keyword<SpacingKeyword>('large'), styles.spacingLarge],
  [Keyword<SpacingKeyword>('huge'), styles.spacingHuge],
] as [string, string | false][]);

export function InlineStack({
  spacing,
  children,
  ...systemProps
}: PropsWithChildren<Props>) {
  const view = useViewProps({...systemProps, display: 'grid'});
  view.addClassName(styles.InlineStack);

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
      view.addStyles({
        gap: relativeSize(Pixels.parse(normalizedSpacing as PixelValue)),
      });
    } else if (systemClassName) {
      view.addClassName(systemClassName);
    }
  }

  return <div {...resolveViewProps(view)}>{children}</div>;
}
