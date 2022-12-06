import {
  type ExtensionPoint,
  type ExtensionPointDefinition,
} from './shared/clips';

import {SeriesDetailsRenderAccessoryExtensionPoint} from './features/Series';
import {WatchThroughDetailsRenderAccessoryExtensionPoint} from './features/WatchThrough';

export const EXTENSION_POINTS = extensionPoints({
  'Series.Details.RenderAccessory': SeriesDetailsRenderAccessoryExtensionPoint,
  'WatchThrough.Details.RenderAccessory':
    WatchThroughDetailsRenderAccessoryExtensionPoint,
});

function extensionPoints<
  Points extends {
    [Point in ExtensionPoint]: ExtensionPointDefinition<Point, any>;
  },
>(points: Points) {
  return points;
}