import {
  createRemoteElement,
  type RemoteElementPropertiesDefinition,
} from '@lemonmade/remote-ui/elements';

import {VIEW_PROPERTIES, type ViewProperties} from '../View.ts';
import type {
  SpacingValue,
  DirectionKeyword,
  LayoutModeKeyword,
  AlignmentKeyword,
} from '../../styles.ts';
import {RemoteElementSpacingValue} from '../shared.ts';

export interface StackProperties extends ViewProperties {
  spacing?: SpacingValue;
  direction?: DirectionKeyword;
  inlineAlignment?: AlignmentKeyword;
  blockAlignment?: AlignmentKeyword;
  layoutMode?: LayoutModeKeyword;
}

export const COMMON_STACK_PROPERTIES: RemoteElementPropertiesDefinition<
  Omit<StackProperties, 'direction'>
> = {
  ...VIEW_PROPERTIES,
  spacing: {type: RemoteElementSpacingValue},
  blockAlignment: {type: String},
  inlineAlignment: {type: String},
  layoutMode: {type: String},
};

export const Stack = 'ui-stack';

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
export const StackElement = createRemoteElement<StackProperties>({
  properties: {
    ...COMMON_STACK_PROPERTIES,
    direction: {type: String},
  },
});

customElements.define(Stack, StackElement);

declare global {
  interface HTMLElementTagNameMap {
    [Stack]: InstanceType<typeof StackElement>;
  }
}
