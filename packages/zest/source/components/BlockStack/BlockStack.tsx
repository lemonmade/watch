import type {PropsWithChildren} from 'react';
import {variation} from '@lemon/css';

import {type SpacingKeyword} from '../../system';

import {useViewProps, resolveViewProps, type ViewProps} from '../View';

import styles from './BlockStack.module.css';

export type AlignKeyword = 'start' | 'end' | 'center' | 'stretch';

interface Props extends ViewProps {
  spacing?: boolean | SpacingKeyword;
  align?: AlignKeyword;
}

const SPACING_CLASS_MAP = new Map<SpacingKeyword, string | false>([
  ['none', false],
  ['tiny', styles.spacingTiny],
  ['small', styles.spacingSmall],
  ['base', styles.spacingBase],
  ['large', styles.spacingLarge],
  ['huge', styles.spacingHuge],
] as [SpacingKeyword, string | false][]);

export function BlockStack({
  align,
  spacing,
  children,
  ...systemProps
}: PropsWithChildren<Props>) {
  const view = useViewProps({...systemProps, display: 'grid'});
  view.addClassName(styles.BlockStack);

  if (align != null) {
    view.addClassName(styles[variation('align', align)]);
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
