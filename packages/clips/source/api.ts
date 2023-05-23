import {type ThreadSignal} from '@watching/thread-signals';

import {type ExtensionPoint} from './extension-points';

export {type Schema as SharedGraphQLApi} from './graphql/Shared.ts';
export {type Schema as SeriesDetailsGraphQLApi} from './graphql/SeriesDetails.ts';
export {type Schema as WatchThroughDetailsGraphQLApi} from './graphql/WatchThroughDetails.ts';

export type Version = 'unstable';

export interface Api<Point extends ExtensionPoint = ExtensionPoint> {
  readonly version: Version;
  readonly target: Point;
  readonly settings: ThreadSignal<Record<string, unknown>>;
  readonly query: ThreadSignal<Record<string, unknown>>;
}
