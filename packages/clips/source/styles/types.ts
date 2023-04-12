import {CSS_LITERAL_PREFIX} from './constants.ts';

export type CSSLiteralValue = `${typeof CSS_LITERAL_PREFIX}${string}`;

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
  | 'base'
  /**
   * @alias large.1
   */
  | 'large'
  /**
   * @alias large
   */
  | 'large.1'
  | 'large.2';

export type SpacingValue = SpacingKeyword | boolean;

export type ViewportSizeKeyword = 'small' | 'medium' | 'large';

export type AlignmentKeyword =
  | 'start'
  | 'end'
  | 'center'
  | 'stretch'
  | 'spaceBetween';
export type DirectionKeyword = 'inline' | 'block';
export type LayoutModeKeyword = 'logical' /* TODO: | 'physical' */;

export type SizeKeyword = 'auto' | 'fill' | 'hidden';
export type SizeValue = SizeKeyword | CSSLiteralValue | false;
