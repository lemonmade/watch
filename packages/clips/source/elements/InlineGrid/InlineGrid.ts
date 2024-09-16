import {type DirectionKeyword} from '@watching/design';

import {
  Grid,
  type GridAttributes,
  type GridProperties,
  type GridEvents,
} from '../Grid/Grid.ts';

import {backedByAttribute} from '../ClipsElement.ts';

export interface InlineGridAttributes
  extends Omit<GridAttributes, 'direction' | 'inline-sizes' | 'block-sizes'> {
  direction?: Extract<DirectionKeyword, 'inline'>;
  sizes?: string;
}

export interface InlineGridProperties
  extends Omit<GridProperties, 'direction'> {
  direction: Extract<DirectionKeyword, 'inline'>;
  sizes?: string;
}

export interface InlineGridEvents extends GridEvents {}

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
export class InlineGrid
  extends Grid<InlineGridAttributes, InlineGridEvents>
  implements InlineGridProperties
{
  static get observedAttributes(): string[] {
    return ['sizes'] satisfies (keyof InlineGridAttributes)[];
  }

  accessor direction = 'inline' as const;

  @backedByAttribute()
  accessor sizes: string | undefined;
}

customElements.define('ui-inline-grid', InlineGrid);

declare global {
  interface HTMLElementTagNameMap {
    'ui-inline-grid': InstanceType<typeof InlineGrid>;
  }
}
