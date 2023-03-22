import type {ComponentType, PropsWithChildren} from 'react';
import {variation} from '@lemon/css';
import type {
  StackProps as BaseStackProps,
  AlignmentKeyword,
} from '@watching/clips';

import systemStyles from '../../system.module.css';
import {SPACING_CLASS_MAP} from '../../styles/spacing';

import {useViewProps, resolveViewProps, type ViewProps} from '../View';

import styles from './Stack.module.css';

export interface StackProps
  extends BaseStackProps,
    Omit<
      ViewProps,
      | 'padding'
      | 'paddingInlineStart'
      | 'paddingInlineEnd'
      | 'paddingBlockStart'
      | 'paddingBlockEnd'
      | 'inlineAlignment'
      | 'blockAlignment'
    > {}

const INLINE_ALIGNMENT_CLASS_MAP = new Map<AlignmentKeyword, string | false>([
  ['start', styles.inlineAlignmentStart],
  ['center', styles.inlineAlignmentCenter],
  ['end', styles.inlineAlignmentEnd],
  ['stretch', styles.inlineAlignmentStretch],
  ['spaceBetween', styles.inlineAlignmentSpaceBetween],
] as [AlignmentKeyword, string][]);

const BLOCK_ALIGNMENT_CLASS_MAP = new Map<AlignmentKeyword, string | false>([
  ['start', styles.blockAlignmentStart],
  ['center', styles.blockAlignmentCenter],
  ['end', styles.blockAlignmentEnd],
  ['stretch', styles.blockAlignmentStretch],
  ['spaceBetween', styles.blockAlignmentSpaceBetween],
] as [AlignmentKeyword, string][]);

export function Stack(props: PropsWithChildren<StackProps>) {
  const stack = useStackProps(props);
  return <div {...resolveViewProps(stack)}>{props.children}</div>;
}

export const BlockStack: ComponentType<
  PropsWithChildren<Omit<StackProps, 'direction'>>
> = Stack;

export function InlineStack(props: PropsWithChildren<StackProps>) {
  const stack = useStackProps({...props, direction: 'inline'});
  return <div {...resolveViewProps(stack)}>{props.children}</div>;
}

export {resolveViewProps as resolveStackProps};

export function useStackProps({
  spacing,
  direction,
  inlineAlignment,
  blockAlignment,
  ...systemProps
}: StackProps) {
  const view = useViewProps({...systemProps, display: 'flex'});
  view.addClassName(styles.Stack);

  if (direction) {
    view.addClassName(styles[variation('direction', direction)]);
  }

  if (spacing != null) {
    view.addClassName(SPACING_CLASS_MAP.get(spacing));
  }

  if (inlineAlignment) {
    view.addClassName(
      INLINE_ALIGNMENT_CLASS_MAP.get(inlineAlignment),
      (inlineAlignment == null || inlineAlignment === 'stretch') &&
        (direction == null || direction === 'block')
        ? systemStyles.contentInlineSizeFill
        : undefined,
    );
  }

  if (
    (inlineAlignment == null || inlineAlignment === 'stretch') &&
    (direction == null || direction === 'block')
  ) {
    view.addClassName(systemStyles.contentInlineSizeFill);
  }

  if (blockAlignment) {
    view.addClassName(BLOCK_ALIGNMENT_CLASS_MAP.get(blockAlignment));
  }

  return view;
}
