import {type ExtensionPoints} from '@watching/clips';

import {type ExtensionPointDefinition} from './shared';
import {SeriesDetailsRenderAccessory} from './series';
import {WatchThroughDetailsRenderAccessory} from './watchthrough';

export const EXTENSION_POINTS = extensionPoints({
  'Series.Details.RenderAccessory': SeriesDetailsRenderAccessory,
  'WatchThrough.Details.RenderAccessory': WatchThroughDetailsRenderAccessory,
});

function extensionPoints(points: {
  [Point in keyof ExtensionPoints]: ExtensionPointDefinition<Point>;
}) {
  return points;
}
