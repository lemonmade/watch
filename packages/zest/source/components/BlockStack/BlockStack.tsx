import type {PropsWithChildren} from 'react';
import {variation} from '@lemon/css';

import systemStyles from '../../system.module.css';
import {type SpacingKeyword} from '../../system.ts';

import {useViewProps, resolveViewProps, type ViewProps} from '../View.tsx';

import styles from './BlockStack.module.css';

export type AlignKeyword = 'start' | 'end' | 'center' | 'stretch';

export interface BlockStackProps extends ViewProps {
  spacing?: boolean | SpacingKeyword;
  align?: AlignKeyword;
}

const SPACING_CLASS_MAP = new Map<SpacingKeyword, string | false>([
  ['none', systemStyles.spacingNone],
  ['tiny', systemStyles.spacingTiny],
  ['small', systemStyles.spacingSmall],
  ['base', systemStyles.spacingBase],
  ['large', systemStyles.spacingLarge],
  ['huge', systemStyles.spacingHuge],
] as [SpacingKeyword, string | false][]);

export function BlockStack({
  align,
  spacing,
  children,
  ...systemProps
}: PropsWithChildren<BlockStackProps>) {
  const view = useViewProps({...systemProps, display: 'grid'});
  view.addClassName(styles.BlockStack);

  if (align != null) {
    view.addClassName(
      styles[variation('align', align)],
      align === 'stretch' && systemStyles.contentInlineSizeFill,
    );
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
