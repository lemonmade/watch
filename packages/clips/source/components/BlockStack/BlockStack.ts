import {createRemoteElement} from '@lemonmade/remote-ui/elements';

import {COMMON_STACK_PROPERTIES, type StackProperties} from '../Stack.ts';

export interface BlockStackProperties
  extends Omit<StackProperties, 'direction'> {}

export const BlockStack = 'ui-block-stack';

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
export const BlockStackElement = createRemoteElement({
  properties: {...COMMON_STACK_PROPERTIES},
});

customElements.define(BlockStack, BlockStackElement);

declare global {
  interface HTMLElementTagNameMap {
    [BlockStack]: InstanceType<typeof BlockStackElement>;
  }
}
