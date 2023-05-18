import {createRemoteElement} from '@lemonmade/remote-ui/elements';

import {
  COMMON_GRID_PROPERTIES,
  SizeValueOrDynamicSizeValue,
  type GridProperties,
} from '../Grid.ts';

export interface InlineGridProperties
  extends Omit<GridProperties, 'direction' | 'inlineSizes' | 'blockSizes'> {
  sizes: NonNullable<GridProperties['inlineSizes']>;
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
export const InlineGrid = createRemoteElement<InlineGridProperties>({
  properties: {
    ...COMMON_GRID_PROPERTIES,
    sizes: {type: SizeValueOrDynamicSizeValue},
  },
});

customElements.define('ui-inline-grid', InlineGrid);

declare global {
  interface HTMLElementTagNameMap {
    'ui-inline-grid': InstanceType<typeof InlineGrid>;
  }
}
