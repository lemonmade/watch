import type {PropsWithChildren} from 'react';
import {variation} from '@lemon/css';

import systemStyles from '../../system.module.css';
import {type SpacingKeyword, type AlignKeyword} from '../../system';

import {useViewProps, resolveViewProps, type ViewProps} from '../View';

import styles from './InlineStack.module.css';

interface Props extends Omit<ViewProps, 'display'> {
  spacing?: boolean | SpacingKeyword;
  alignment?: AlignKeyword;
}

const SPACING_CLASS_MAP = new Map<SpacingKeyword, string | false>([
  ['none', false],
  ['tiny', styles.spacingTiny],
  ['small', styles.spacingSmall],
  ['base', styles.spacingBase],
  ['large', styles.spacingLarge],
  ['huge', styles.spacingHuge],
] as [SpacingKeyword, string | false][]);

export function InlineStack({
  spacing,
  children,
  alignment,
  ...systemProps
}: PropsWithChildren<Props>) {
  const view = useViewProps({...systemProps, display: 'flex'});
  view.addClassName(styles.InlineStack);

  if (alignment) {
    view.addClassName(systemStyles[variation('inlineAlignment', alignment)]);
  }

  if (spacing != null) {
    let normalizedSpacing: SpacingKeyword;

    if (typeof spacing === 'boolean') {
      normalizedSpacing = spacing ? 'base' : 'none';
    } else {
      normalizedSpacing = spacing;
    }

    const systemClassName = SPACING_CLASS_MAP.get(normalizedSpacing);
    view.addClassName(systemClassName);
  }

  return <div {...resolveViewProps(view)}>{children}</div>;
}
