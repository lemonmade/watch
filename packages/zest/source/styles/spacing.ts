import type {SpacingKeyword} from '../system';

import spacingStyles from './spacing.module.css';

export type {SpacingKeyword};

export const SPACING_CLASS_MAP = new Map<
  SpacingKeyword | boolean,
  string | false
>([
  // Omitted for size
  // [false, false],
  // ['none', false],
  ['small.2', spacingStyles.spacingSmall2],
  ['small.1', spacingStyles.spacingSmall1],
  ['small', spacingStyles.spacingSmall1],
  [true, spacingStyles.spacingAuto],
  ['auto', spacingStyles.spacingAuto],
  ['large', spacingStyles.spacingLarge1],
  ['large.1', spacingStyles.spacingLarge1],
  ['large.2', spacingStyles.spacingLarge2],
] as [SpacingKeyword, string | false][]);
