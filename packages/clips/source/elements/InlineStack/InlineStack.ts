import {type DirectionKeyword} from '@watching/design';

import {
  Stack,
  type StackAttributes,
  type StackProperties,
  type StackEvents,
} from '../Stack.ts';

export interface InlineStackAttributes
  extends Omit<StackAttributes, 'direction'> {
  direction?: Extract<DirectionKeyword, 'inline'>;
}

export interface InlineStackProperties
  extends Omit<StackProperties, 'direction'> {
  direction: Extract<DirectionKeyword, 'inline'>;
}

export interface InlineStackEvents extends StackEvents {}

/**
 * A `InlineStack` is a container component that lays out sibling elements
 * beside one another. Children of a `InlineStack` keep their intrinsic size,
 * and will wrap to additional lines if their combined size is larger
 * than the space available to the `InlineStack`.
 *
 * An `InlineStack` lays out its children along the inline axis (horizontally,
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
export class InlineStack
  extends Stack<InlineStackAttributes, InlineStackEvents>
  implements InlineStackProperties
{
  accessor direction = 'inline' as const;
}

customElements.define('ui-inline-stack', InlineStack);

declare global {
  interface HTMLElementTagNameMap {
    'ui-inline-stack': InstanceType<typeof InlineStack>;
  }
}
