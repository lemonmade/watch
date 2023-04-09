import type {PropsWithChildren} from 'react';
import {variation} from '@lemon/css';

import systemStyles from '../../system.module.css';
import {type SpacingKeyword, type AlignKeyword} from '../../system.ts';

import {useViewProps, resolveViewProps, type ViewProps} from '../View.tsx';

import styles from './InlineStack.module.css';

export interface InlineStackProps
  extends Omit<ViewProps, 'display' | 'alignment' | 'inlineAlignment'> {
  spacing?: boolean | SpacingKeyword;
  alignment?: AlignKeyword;
}

const SPACING_CLASS_MAP = new Map<SpacingKeyword, string | false>([
  ['none', systemStyles.spacingNone],
  ['tiny', systemStyles.spacingTiny],
  ['small', systemStyles.spacingSmall],
  ['base', systemStyles.spacingBase],
  ['large', systemStyles.spacingLarge],
  ['huge', systemStyles.spacingHuge],
] as [SpacingKeyword, string | false][]);

export function InlineStack({
  spacing,
  children,
  alignment,
  ...systemProps
}: PropsWithChildren<InlineStackProps>) {
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
