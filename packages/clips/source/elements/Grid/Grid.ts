import {
  SPACING_KEYWORDS,
  type SpacingKeyword,
  DIRECTION_KEYWORDS,
  type DirectionKeyword,
  ALIGNMENT_KEYWORDS,
  type AlignmentKeyword,
  LAYOUT_MODE_KEYWORDS,
  type LayoutModeKeyword,
} from '@watching/design';

import {
  backedByAttribute,
  attributeRestrictedToAllowedValues,
  formatAutoOrNoneAttributeValue,
  type AttributeValueAsPropertySetter,
} from '../ClipsElement.ts';

import {
  View,
  type ViewAttributes,
  type ViewProperties,
  type ViewEvents,
} from '../View/View.ts';

export interface GridAttributes extends ViewAttributes {
  spacing?: SpacingKeyword;
  'inline-spacing'?: SpacingKeyword;
  'block-spacing'?: SpacingKeyword;
  direction?: DirectionKeyword;
  'inline-sizes'?: string;
  'block-sizes'?: string;
  'inline-alignment'?: AlignmentKeyword;
  'block-alignment'?: AlignmentKeyword;
  'layout-mode'?: LayoutModeKeyword;
}

export interface GridProperties extends ViewProperties {
  get spacing(): SpacingKeyword;
  set spacing(value: SpacingKeyword | boolean | undefined);
  inlineSpacing?: SpacingKeyword;
  blockSpacing?: SpacingKeyword;
  direction: DirectionKeyword;
  inlineSizes?: string;
  blockSizes?: string;
  inlineAlignment: AlignmentKeyword;
  blockAlignment: AlignmentKeyword;
  layoutMode: LayoutModeKeyword;
}

export interface GridEvents extends ViewEvents {}

const DEFAULT_SPACING_VALUE = 'none';

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
export class Grid<
    Attributes extends GridAttributes = GridAttributes,
    Events extends GridEvents = GridEvents,
  >
  extends View<Attributes, Events>
  implements GridProperties
{
  static get remoteAttributes(): string[] {
    return [
      'spacing',
      'inline-spacing',
      'block-spacing',
      'direction',
      'inline-sizes',
      'block-sizes',
      'inline-alignment',
      'block-alignment',
      'layout-mode',
    ] satisfies (keyof GridAttributes)[];
  }

  get spacing(): SpacingKeyword {
    return (
      formatAutoOrNoneAttributeValue(this.getAttribute('spacing'), {
        allowed: SPACING_KEYWORDS,
      }) ?? DEFAULT_SPACING_VALUE
    );
  }

  set spacing(value: AttributeValueAsPropertySetter<SpacingKeyword>) {
    const resolvedValue =
      formatAutoOrNoneAttributeValue(value, {
        allowed: SPACING_KEYWORDS,
      }) ?? DEFAULT_SPACING_VALUE;

    if (resolvedValue === DEFAULT_SPACING_VALUE) {
      this.removeAttribute('spacing');
    } else {
      this.setAttribute('spacing', resolvedValue);
    }
  }

  get inlineSpacing(): SpacingKeyword {
    return (
      formatAutoOrNoneAttributeValue(this.getAttribute('inline-spacing'), {
        allowed: SPACING_KEYWORDS,
      }) ?? DEFAULT_SPACING_VALUE
    );
  }

  set inlineSpacing(value: AttributeValueAsPropertySetter<SpacingKeyword>) {
    const resolvedValue = formatAutoOrNoneAttributeValue(value, {
      allowed: SPACING_KEYWORDS,
    });

    if (resolvedValue == null) {
      this.removeAttribute('inline-spacing');
    } else {
      this.setAttribute('inline-spacing', resolvedValue);
    }
  }

  get blockSpacing(): SpacingKeyword {
    return (
      formatAutoOrNoneAttributeValue(this.getAttribute('block-spacing'), {
        allowed: SPACING_KEYWORDS,
      }) ?? DEFAULT_SPACING_VALUE
    );
  }

  set blockSpacing(value: AttributeValueAsPropertySetter<SpacingKeyword>) {
    const resolvedValue = formatAutoOrNoneAttributeValue(value, {
      allowed: SPACING_KEYWORDS,
    });

    if (resolvedValue == null) {
      this.removeAttribute('block-spacing');
    } else {
      this.setAttribute('block-spacing', resolvedValue);
    }
  }

  @backedByAttribute({
    ...attributeRestrictedToAllowedValues(DIRECTION_KEYWORDS),
  })
  accessor direction: DirectionKeyword = 'block';

  @backedByAttribute({
    name: 'inline-sizes',
  })
  accessor inlineSizes: string | undefined;

  @backedByAttribute({
    name: 'block-sizes',
  })
  accessor blockSizes: string | undefined;

  @backedByAttribute({
    name: 'inline-alignment',
    ...attributeRestrictedToAllowedValues(ALIGNMENT_KEYWORDS),
  })
  accessor inlineAlignment: AlignmentKeyword = 'stretch';

  @backedByAttribute({
    name: 'block-alignment',
    ...attributeRestrictedToAllowedValues(ALIGNMENT_KEYWORDS),
  })
  accessor blockAlignment: AlignmentKeyword = 'start';

  @backedByAttribute({
    name: 'layout-mode',
    ...attributeRestrictedToAllowedValues(LAYOUT_MODE_KEYWORDS),
  })
  accessor layoutMode: LayoutModeKeyword = 'logical';
}

customElements.define('ui-grid', Grid);

declare global {
  interface HTMLElementTagNameMap {
    'ui-grid': InstanceType<typeof Grid>;
  }
}
