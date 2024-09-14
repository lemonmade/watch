import {
  HEADING_LEVELS,
  type HeadingLevel,
  HEADING_ACCESSIBILITY_ROLE_KEYWORDS,
  type HeadingAccessibilityRoleKeyword,
} from '@watching/design';

import {
  ClipsElement,
  backedByAttribute,
  backedByAttributeAsBoolean,
  attributeRestrictedToAllowedValues,
} from '../ClipsElement.ts';

export interface HeadingAttributes {
  /**
   * The visual level of the heading.
   */
  level?: `${HeadingLevel}` | 'auto';

  /**
   * Whether to add a divider separating the heading from the content that follows it.
   */
  divider?: '';

  /**
   * How the heading should be announced for accessibility purposes.
   */
  'accessibility-role'?: HeadingAccessibilityRoleKeyword;
}

export interface HeadingProperties {
  /**
   * The visual level of the heading. Headings get a default design according to their
   * accessibility level, which is determined by the nesting of `Section` components containing
   * this heading.
   */
  get level(): HeadingLevel | 'auto';
  set level(value: HeadingLevel | `${HeadingLevel}` | 'auto' | undefined);

  /**
   * Whether to add a divider separating the heading from the content that follows it.
   * @default false
   */
  divider: boolean;

  /**
   * How the heading should be announced for accessibility purposes. `heading` is the default,
   * and creates semantic content headings. `presentation` can be used in rare cases when you
   * want a piece of text to visually look like a heading, but it should not create a nested
   * document structure.
   * @default 'heading'
   */
  accessibilityRole: HeadingAccessibilityRoleKeyword;
}

export interface HeadingEvents {}

/**
 * Headings are used as the title for a section of content. Headings automatically
 * get a default level based on how they are nested in `Section` components. Each `Section`
 * creates a logical section by incrementing the heading level.
 *
 * You can change the visual appearance of a heading by setting the `level` prop, but you
 * **can not** change the heading level for accessibility purposes. You must use `Section`
 * components to create an accessible document structure.
 */
export class Heading
  extends ClipsElement<HeadingAttributes>
  implements HeadingProperties
{
  static get remoteAttributes() {
    return [
      'level',
      'divider',
      'accessibility-role',
    ] satisfies (keyof HeadingAttributes)[];
  }

  get level(): HeadingLevel | 'auto' {
    const level = this.getAttribute('level');
    if (level === 'auto') return 'auto';
    const toNumber = Number(level) as HeadingLevel;
    return HEADING_LEVELS.has(toNumber) ? toNumber : 'auto';
  }

  set level(value: HeadingLevel | `${HeadingLevel}` | 'auto' | undefined) {
    if (value === 'auto') {
      this.setAttribute('level', 'auto');
    } else {
      const toNumber = Number(value) as HeadingLevel;
      if (HEADING_LEVELS.has(toNumber)) {
        this.setAttribute('level', toNumber.toString());
      }
    }
  }

  @backedByAttributeAsBoolean()
  accessor divider: boolean = false;

  @backedByAttribute({
    name: 'accessibility-role',
    ...attributeRestrictedToAllowedValues(HEADING_ACCESSIBILITY_ROLE_KEYWORDS),
  })
  accessor accessibilityRole: HeadingAccessibilityRoleKeyword = 'heading';
}

customElements.define('ui-heading', Heading);

declare global {
  interface HTMLElementTagNameMap {
    'ui-heading': InstanceType<typeof Heading>;
  }
}
