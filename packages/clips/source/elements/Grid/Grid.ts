import {
  createRemoteElement,
  type RemoteElementPropertyType,
  type RemoteElementPropertiesDefinition,
} from '@remote-dom/core/elements';

import {VIEW_PROPERTIES, type ViewProperties} from '../View.ts';
import {RemoteElementSpacingValue} from '../shared.ts';
import type {
  SizeValue,
  SpacingValue,
  DirectionKeyword,
  LayoutModeKeyword,
  AlignmentKeyword,
  ValueOrStyleDynamicValue,
} from '../../styles.ts';

export interface GridProperties extends ViewProperties {
  spacing?: SpacingValue;
  inlineSpacing?: SpacingValue;
  blockSpacing?: SpacingValue;
  direction?: DirectionKeyword;
  inlineSizes?: ValueOrStyleDynamicValue<readonly SizeValue[]>;
  blockSizes?: ValueOrStyleDynamicValue<readonly SizeValue[]>;
  inlineAlignment?: AlignmentKeyword;
  blockAlignment?: AlignmentKeyword;
  layoutMode?: LayoutModeKeyword;
}

export const COMMON_GRID_PROPERTIES: RemoteElementPropertiesDefinition<
  Omit<GridProperties, 'direction' | 'blockSizes' | 'inlineSizes'>
> = {
  ...VIEW_PROPERTIES,
  spacing: {type: RemoteElementSpacingValue, default: false},
  inlineSpacing: {type: RemoteElementSpacingValue, default: false},
  blockSpacing: {type: RemoteElementSpacingValue, default: false},
  blockAlignment: {type: String},
  inlineAlignment: {type: String},
  layoutMode: {type: String},
};

export const SizeValueOrDynamicSizeValue: RemoteElementPropertyType<
  ValueOrStyleDynamicValue<readonly SizeValue[]>
> = {
  parse(value) {
    if (typeof value === 'string' && value.startsWith('css:')) {
      return value;
    }

    try {
      return JSON.parse((value as any) ?? '[]');
    } catch {
      return String(value).split(/\s+/g);
    }
  },
};

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
export const Grid = createRemoteElement<GridProperties>({
  properties: {
    ...COMMON_GRID_PROPERTIES,
    direction: {type: String},
    blockSizes: {type: SizeValueOrDynamicSizeValue},
    inlineSizes: {type: SizeValueOrDynamicSizeValue},
  },
});

customElements.define('ui-grid', Grid);

declare global {
  interface HTMLElementTagNameMap {
    'ui-grid': InstanceType<typeof Grid>;
  }
}
