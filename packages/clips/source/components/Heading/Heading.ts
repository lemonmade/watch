import {createRemoteElement} from '@lemonmade/remote-ui/elements';

/**
 * A visual heading level, which corresponds to a theme-dependent visual design.
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * How the heading should be announced for accessibility purposes. `heading` is the default,
 * and creates semantic content headings. `presentation` can be used in rare cases when you
 * want a piece of text to visually look like a heading, but it should not create a nested
 * document structure.
 */
export type HeadingAccessibilityRole = 'heading' | 'presentation';

export interface HeadingProperties {
  /**
   * The visual level of the heading. Headings get a default design according to their
   * accessibility level, which is determined by the nesting of `Section` components containing
   * this heading.
   */
  level?: HeadingLevel;

  /**
   * Whether to add a divider separating the heading from the content that follows it.
   * @default false
   */
  divider?: boolean;

  /**
   * How the heading should be announced for accessibility purposes. `heading` is the default,
   * and creates semantic content headings. `presentation` can be used in rare cases when you
   * want a piece of text to visually look like a heading, but it should not create a nested
   * document structure.
   * @default 'heading'
   */
  accessibilityRole?: HeadingAccessibilityRole;
}

export const Heading = 'ui-heading';

/**
 * Headings are used as the title for a section of content. Headings automatically
 * get a default level based on how they are nested in `Section` components. Each `Section`
 * creates a logical section by incrementing the heading level.
 *
 * You can change the visual appearance of a heading by setting the `level` prop, but you
 * **can not** change the heading level for accessibility purposes. You must use `Section`
 * components to create an accessible document structure.
 */
export const HeadingElement = createRemoteElement<HeadingProperties>({
  properties: {
    level: {type: Number},
    divider: {type: Boolean},
    accessibilityRole: {type: String},
  },
});

customElements.define(Heading, HeadingElement);

declare global {
  interface HTMLElementTagNameMap {
    [Heading]: InstanceType<typeof HeadingElement>;
  }
}
