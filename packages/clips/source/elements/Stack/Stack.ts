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
  attributeRestrictedToAllowedValues,
  backedByAttribute,
  restrictToAllowedValues,
} from '../ClipsElement.ts';

import {
  View,
  type ViewAttributes,
  type ViewProperties,
  type ViewEvents,
} from '../View/View.ts';

export interface StackAttributes extends ViewAttributes {
  spacing?: SpacingKeyword;
  direction?: DirectionKeyword;
  'inline-alignment'?: AlignmentKeyword;
  'block-alignment'?: AlignmentKeyword;
  'layout-mode'?: LayoutModeKeyword;
}

export interface StackProperties extends ViewProperties {
  get spacing(): SpacingKeyword;
  set spacing(value: SpacingKeyword | boolean | undefined);
  direction: DirectionKeyword;
  inlineAlignment: AlignmentKeyword;
  blockAlignment: AlignmentKeyword;
  layoutMode: LayoutModeKeyword;
}

export interface StackEvents extends ViewEvents {}

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
export class Stack<
    Attributes extends StackAttributes = StackAttributes,
    Events extends StackEvents = StackEvents,
  >
  extends View<Attributes, Events>
  implements StackProperties
{
  static get remoteAttributes(): string[] {
    return [
      'spacing',
      'direction',
      'inline-alignment',
      'block-alignment',
      'layout-mode',
    ] satisfies (keyof StackAttributes)[];
  }

  get spacing(): SpacingKeyword {
    return (
      restrictToAllowedValues(this.getAttribute('padding'), SPACING_KEYWORDS) ??
      'none'
    );
  }

  set spacing(value: SpacingKeyword | boolean) {
    const resolvedValue =
      value === true ? 'auto' : value === false ? 'none' : value;

    if (resolvedValue === 'none') {
      this.removeAttribute('padding');
    } else {
      this.setAttribute('padding', resolvedValue);
    }
  }

  @backedByAttribute({
    ...attributeRestrictedToAllowedValues(DIRECTION_KEYWORDS),
  })
  accessor direction: DirectionKeyword = 'block';

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

customElements.define('ui-stack', Stack);

declare global {
  interface HTMLElementTagNameMap {
    'ui-stack': InstanceType<typeof Stack>;
  }
}
