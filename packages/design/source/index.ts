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

export type CornerRadiusKeyword =
  | 'none'
  | /** @alias small */ 'small.1'
  | 'small'
  | 'auto'
  | 'large'
  | /** @alias large */ 'large.1';

export const CORNER_RADIUS_KEYWORDS = new Set<CornerRadiusKeyword>([
  'none',
  'small.1',
  'small',
  'auto',
  'large',
  'large.1',
]);

export type SpacingOrNoneKeyword = 'none' | 'auto';

export const SPACING_OR_NONE_KEYWORDS = new Set<SpacingOrNoneKeyword>([
  'none',
  'auto',
]);

export type DirectionKeyword = 'inline' | 'block';

export const DIRECTION_KEYWORDS = new Set<DirectionKeyword>([
  'inline',
  'block',
]);

export type LayoutModeKeyword = 'logical' /* TODO: | 'physical' */;

export const LAYOUT_MODE_KEYWORDS = new Set<LayoutModeKeyword>(['logical']);

export type AlignmentKeyword =
  | 'start'
  | 'end'
  | 'center'
  | 'stretch'
  | 'space-between';

export const ALIGNMENT_KEYWORDS = new Set<AlignmentKeyword>([
  'start',
  'end',
  'center',
  'stretch',
  'space-between',
]);

// Grid

export type GridSizeKeyword = 'auto' | 'none' | 'fill';

export const GRID_SIZE_KEYWORDS = new Set<GridSizeKeyword>([
  'auto',
  'none',
  'fill',
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

// Image

export type ImageFitKeyword = 'auto' | 'cover' | 'contain';

export const IMAGE_FIT_KEYWORDS = new Set<ImageFitKeyword>([
  'auto',
  'cover',
  'contain',
]);

export type ImageLoadingKeyword = 'immediate' | 'in-viewport';

export const IMAGE_LOADING_KEYWORDS = new Set<ImageLoadingKeyword>([
  'immediate',
  'in-viewport',
]);

export type ImageAccessibilityRoleKeyword = 'image' | 'decorative';

export const IMAGE_ACCESSIBILITY_ROLE_KEYWORDS =
  new Set<ImageAccessibilityRoleKeyword>(['image', 'decorative']);

export type ViewportResolution = 1 | 1.3 | 1.5 | 2 | 2.6 | 3 | 3.5 | 4;

// Button

export type ButtonNavigateAction = `navigate(${string})`;
export type ButtonMutateAction = `mutate(${string})`;
export type ButtonAction = 'auto' | ButtonNavigateAction | ButtonMutateAction;

// Popover

export type PopoverAttachmentKeyword = 'auto' | 'start' | 'center' | 'end';

export const POPOVER_ATTACHMENT_KEYWORDS = new Set<PopoverAttachmentKeyword>([
  'auto',
  'start',
  'center',
  'end',
]);

// Skeletons

export type SkeletonTextSizeKeyword =
  | 'small.1'
  | 'small'
  | 'auto'
  | 'large'
  | 'large.1';

export const SKELETON_TEXT_SIZE_KEYWORDS = new Set<SkeletonTextSizeKeyword>([
  'small.1',
  'small',
  'auto',
  'large',
  'large.1',
]);

export type SkeletonButtonSizeKeyword =
  | 'small.1'
  | 'small'
  | 'auto'
  | 'large'
  | 'large.1';

export const SKELETON_BUTTON_SIZE_KEYWORDS = new Set<SkeletonButtonSizeKeyword>(
  ['small.1', 'small', 'auto', 'large', 'large.1'],
);
