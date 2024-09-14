// System

export type SpacingKeyword =
  | 'none'
  | 'small.2'
  /**
   * @alias small
   */
  | 'small.1'
  /**
   * @alias small.1
   */
  | 'small'
  | 'auto'
  /**
   * @alias large.1
   */
  | 'large'
  /**
   * @alias large
   */
  | 'large.1'
  | 'large.2';

export const SPACING_KEYWORDS = new Set<SpacingKeyword>([
  'none',
  'small.2',
  'small.1',
  'small',
  'auto',
  'large',
  'large.1',
  'large.2',
]);

// Text

export type TextEmphasisKeyword = 'strong' | 'auto' | 'subdued';

export const TEXT_EMPHASIS_KEYWORDS = new Set<TextEmphasisKeyword>([
  'strong',
  'auto',
  'subdued',
]);

// Heading

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingLevelKeyword = `${HeadingLevel}` | 'auto';

export const HEADING_LEVELS = new Set<HeadingLevel>([1, 2, 3, 4, 5, 6]);

export type HeadingAccessibilityRoleKeyword = 'heading' | 'presentation';

export const HEADING_ACCESSIBILITY_ROLE_KEYWORDS =
  new Set<HeadingAccessibilityRoleKeyword>(['heading', 'presentation']);

// TextField

export type TextFieldKeyboardTypeKeyword = 'text' | 'email';

export const TEXT_FIELD_KEYBOARD_TYPE_KEYWORDS =
  new Set<TextFieldKeyboardTypeKeyword>(['text', 'email']);

export type TextFieldLabelStyleKeyword = 'default' | 'placeholder';

export const TEXT_FIELD_LABEL_STYLE_KEYWORDS =
  new Set<TextFieldLabelStyleKeyword>(['default', 'placeholder']);

export type TextFieldResizeKeyword = 'none' | 'block';

export const TEXT_FIELD_RESIZE_KEYWORDS = new Set<TextFieldResizeKeyword>([
  'none',
  'block',
]);

export type TextFieldAutocompleteTarget = 'username' | 'email' | 'webauthn';
export type TextFieldAutocompleteValue =
  | TextFieldAutocompleteTarget
  | `${TextFieldAutocompleteTarget} ${TextFieldAutocompleteTarget}`;
