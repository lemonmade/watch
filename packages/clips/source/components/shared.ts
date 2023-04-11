import {type Signal} from '@watching/thread-signals';

export type SignalOrValue<T> = T | Signal<T>;
export type ValueOrArray<T> = T | readonly T[];

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
export type SizePercentage = `${number}%`;
export type SizeValue = SizeKeyword | SizePercentage | false | number;
