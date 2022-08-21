import {type ExtensionPoint} from '@watching/clips';
import {type LocalExtension, type LocalExtensionPointSupport} from './app';

const TARGET_MAP: Record<
  ExtensionPoint,
  (support: LocalExtensionPointSupport) => string
> = {
  'Season.Details.RenderAccessory': getSeriesForExtensionPointSupport,
  'Series.Details.RenderAccessory': getSeriesForExtensionPointSupport,
  'WatchThrough.Details.RenderAccessory': () => '/app/watchthrough/.random',
};

export async function targetForExtension(
  extension: LocalExtension,
  extensionPoint: LocalExtensionPointSupport | undefined = extension.extends[0],
) {
  if (extensionPoint == null) return undefined;
  return extensionPoint
    ? TARGET_MAP[extensionPoint.target](extensionPoint)
    : undefined;
}

function getSeriesForExtensionPointSupport({
  conditions = [],
}: LocalExtensionPointSupport) {
  let seriesTarget: string | undefined;

  for (const condition of conditions) {
    if (condition.series) {
      seriesTarget = condition.series.handle;
    }

    if (seriesTarget != null) {
      break;
    }
  }

  return seriesTarget ? `/app/series/${seriesTarget}` : '/app/series/.random';
}
