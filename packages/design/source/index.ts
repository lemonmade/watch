// Text

export type TextEmphasisKeyword = 'strong' | 'auto' | 'subdued';

export const TEXT_EMPHASIS_KEYWORDS = new Set<TextEmphasisKeyword>([
  'strong',
  'auto',
  'subdued',
]);

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
