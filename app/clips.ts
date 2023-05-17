import {
  type ExtensionPoint,
  type ExtensionPointDefinition,
} from './shared/clips.ts';

import {SeriesDetailsAccessoryExtensionPoint} from './features/Series.ts';
import {WatchThroughDetailsAccessoryExtensionPoint} from './features/WatchThrough.ts';

export const EXTENSION_POINTS = extensionPoints({
  'series.details.accessory': SeriesDetailsAccessoryExtensionPoint,
  'watch-through.details.accessory': WatchThroughDetailsAccessoryExtensionPoint,
});

function extensionPoints<
  Points extends {
    [Point in ExtensionPoint]: ExtensionPointDefinition<Point, any>;
  },
>(points: Points) {
  return points;
}
