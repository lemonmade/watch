import {type Signal, type ThreadSignal} from '@watching/thread-signals';

import {type ExtensionPoint} from './extension-points';

export type Version = 'unstable';

export interface Api<
  Point extends ExtensionPoint = ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
> {
  readonly version: Version;
  readonly target: Point;
  readonly query: Signal<Query>;
  readonly settings: Signal<Settings>;
}

export interface ApiCore<
  Point extends ExtensionPoint = ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
> {
  readonly version: Version;
  readonly target: Point;
  readonly query: ThreadSignal<Query>;
  readonly settings: ThreadSignal<Settings>;
}
