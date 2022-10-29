import {type Signal} from '@watching/thread-signals';

export type SignalOrValue<T> = T | Signal<T>;

export type SpacingValue =
  | 'none'
  | 'tiny'
  | 'small'
  | 'base'
  | 'large'
  | 'huge';
