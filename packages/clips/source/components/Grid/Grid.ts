import {createRemoteComponent} from '@remote-ui/core';

import type {ViewProps} from '../View.ts';
import type {
  SizeValue,
  SpacingValue,
  DirectionKeyword,
  LayoutModeKeyword,
  AlignmentKeyword,
  ValueOrStyleDynamicValue,
} from '../../styles.ts';

export interface GridProps extends ViewProps {
  spacing?: SpacingValue;
  direction?: DirectionKeyword;
  inlineSpacing?: SpacingValue;
  blockSpacing?: SpacingValue;
  inlineSizes?: ValueOrStyleDynamicValue<readonly SizeValue[]>;
  blockSizes?: ValueOrStyleDynamicValue<readonly SizeValue[]>;
  inlineAlignment?: AlignmentKeyword;
  blockAlignment?: AlignmentKeyword;
  layoutMode?: LayoutModeKeyword;
}

/**
 * A `Grid` is a container component that lays out sibling elements
 * using predetermined sizes. First, children are laid out along the
 * inline axis (horizontally, in most Western locales), with sizes
 * set by the `inlineSizes` property. Then, children are laid out along
 * the block axis (vertically, in most Western locales), with sizes
 * set by the `blockSizes` property. This lets you construct two-dimensional
 * layouts without needing to nest `Stack` components.
 *
 * You can configure a consistent spacing between siblings using the `spacing`
 * property, or using the `blockSpacing` and `inlineSpacing` properties for
 * per-axis control. If you need to control how children are aligned on either
 * the inline or block axis, you can use the `inlineAlignment` and `blockAlignment`
 * properties.
 *
 * In addition to the grid-specific properties described above, You can
 * pass any property available on `View` to a `Grid` component.
 */
export const Grid = createRemoteComponent<'Grid', GridProps>('Grid');

export interface BlockGridProps
  extends Omit<GridProps, 'inlineSizes' | 'blockSizes'> {
  sizes: NonNullable<GridProps['blockSizes']>;
}

/**
 * A `BlockGrid` is a container component that lays out sibling elements
 * using predetermined sizes. Children are laid out along the inline axis
 * (horizontally, in most Western locales), with sizes set by the `sizes`
 * property. If there are more children than sizes, additional rows will be
 * created along the block axis, with each row having their intrinsic block
 * size.
 *
 * You can configure a consistent spacing between siblings using the `spacing`
 * property, or using the `blockSpacing` and `inlineSpacing` properties for
 * per-axis control. If you need to control how children are aligned on either
 * the inline or block axis, you can use the `inlineAlignment` and `blockAlignment`
 * properties.
 *
 * In addition to the grid-specific properties described above, You can
 * pass any property available on `View` to a `BlockGrid` component.
 */
export const BlockGrid = createRemoteComponent<'BlockGrid', BlockGridProps>(
  'BlockGrid',
);

export interface InlineGridProps
  extends Omit<GridProps, 'inlineSizes' | 'blockSizes'> {
  sizes: NonNullable<GridProps['inlineSizes']>;
}

/**
 * A `InlineGrid` is a container component that lays out sibling elements
 * using predetermined sizes. Children are laid out along the inline axis
 * (horizontally, in most Western locales), with sizes set by the `sizes`
 * property. If there are more children than sizes, additional rows will be
 * created along the block axis, with each row having their intrinsic block
 * size.
 *
 * You can configure a consistent spacing between siblings using the `spacing`
 * property, or using the `blockSpacing` and `inlineSpacing` properties for
 * per-axis control. If you need to control how children are aligned on either
 * the inline or block axis, you can use the `inlineAlignment` and `blockAlignment`
 * properties.
 *
 * In addition to the grid-specific properties described above, You can
 * pass any property available on `View` to a `InlineGrid` component.
 */
export const InlineGrid = createRemoteComponent<'InlineGrid', InlineGridProps>(
  'InlineGrid',
);
