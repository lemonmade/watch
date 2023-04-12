import {createRemoteComponent} from '@remote-ui/core';

import type {ViewProps} from '../View.ts';
import type {
  SpacingValue,
  DirectionKeyword,
  LayoutModeKeyword,
  AlignmentKeyword,
} from '../../styles.ts';

export interface StackProps extends ViewProps {
  spacing?: SpacingValue;
  direction?: DirectionKeyword;
  inlineAlignment?: AlignmentKeyword;
  blockAlignment?: AlignmentKeyword;
  layoutMode?: LayoutModeKeyword;
}

/**
 * A `Stack` is a container component that lays out sibling elements
 * beside one another. Children of a `Stack` keep their intrinsic size,
 * and will wrap to additional lines if their combined size is larger
 * than the space available to the `Stack`.
 *
 * `Stack`s default to laying out siblings along the block axis (which
 * is vertical in most Western locales). You can control whether siblings
 * are laid out along the block or inline axis (horizontal, in most Western
 * locales) using the `direction` prop.
 *
 * You can configure a consistent spacing between siblings using the `spacing`
 * prop. If you need to control how children are aligned on either the inline
 * or block axis, you can use the `inlineAlignment` and `blockAlignment`
 * properties.
 *
 * In addition to the stacking-specific properties described above, You can
 * pass any property available on `View` to a `Stack` component.
 */
export const Stack = createRemoteComponent<'Stack', StackProps>('Stack');

export interface BlockStackProps extends Omit<StackProps, 'direction'> {}

/**
 * A `BlockStack` is a container component that lays out sibling elements
 * beside one another. Children of a `BlockStack` keep their intrinsic size,
 * and will wrap to additional lines if their combined size is larger
 * than the space available to the `BlockStack`.
 *
 * `BlockStack`s lays out its children along the block axis (horizontally,
 * in most Western locales). To lay out children along the block axis (vertically,
 * in most Western locales), you can use a `BlockStack`. To lay out children with
 * a direction decided at runtime, you can use a `Stack`.
 *
 * You can configure a consistent spacing between siblings using the `spacing`
 * prop. If you need to control how children are aligned on either the block
 * or block axis, you can use the `blockAlignment` and `blockAlignment`
 * properties.
 *
 * In addition to the stacking-specific properties described above, You can
 * pass any property available on `View` to a `BlockStack` component.
 */
export const BlockStack = createRemoteComponent<'BlockStack', BlockStackProps>(
  'BlockStack',
);

export interface InlineStackProps extends Omit<StackProps, 'direction'> {}

/**
 * A `InlineStack` is a container component that lays out sibling elements
 * beside one another. Children of a `InlineStack` keep their intrinsic size,
 * and will wrap to additional lines if their combined size is larger
 * than the space available to the `InlineStack`.
 *
 * `InlineStack`s lays out its children along the inline axis (horizontally,
 * in most Western locales). To lay out children along the block axis (vertically,
 * in most Western locales), you can use a `BlockStack`. To lay out children with
 * a direction decided at runtime, you can use a `Stack`.
 *
 * You can configure a consistent spacing between siblings using the `spacing`
 * prop. If you need to control how children are aligned on either the inline
 * or block axis, you can use the `inlineAlignment` and `blockAlignment`
 * properties.
 *
 * In addition to the stacking-specific properties described above, You can
 * pass any property available on `View` to a `InlineStack` component.
 */
export const InlineStack = createRemoteComponent<
  'InlineStack',
  InlineStackProps
>('InlineStack');
