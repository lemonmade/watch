import {type DirectionKeyword} from '@watching/design';

import {
  Stack,
  type StackAttributes,
  type StackProperties,
  type StackEvents,
} from '../Stack/Stack.ts';

export interface BlockStackAttributes
  extends Omit<StackAttributes, 'direction'> {
  direction?: Extract<DirectionKeyword, 'block'>;
}

export interface BlockStackProperties
  extends Omit<StackProperties, 'direction'> {
  direction: Extract<DirectionKeyword, 'block'>;
}

export interface BlockStackEvents extends StackEvents {}

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
export class BlockStack
  extends Stack<BlockStackAttributes, BlockStackEvents>
  implements BlockStackProperties
{
  accessor direction = 'block' as const;
}

customElements.define('ui-block-stack', BlockStack);

declare global {
  interface HTMLElementTagNameMap {
    'ui-block-stack': InstanceType<typeof BlockStack>;
  }
}
