import {type Signal, type ThreadSignal} from '@watching/thread-signals';

import {type ExtensionPoint} from './extension-points';

export {type Schema as SharedGraphQLApi} from './graphql/Shared.ts';
export {type Schema as SeriesDetailsGraphQLApi} from './graphql/SeriesDetails.ts';
export {type Schema as WatchThroughDetailsGraphQLApi} from './graphql/WatchThroughDetails.ts';

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
