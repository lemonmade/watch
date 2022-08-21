import {type ExtensionPoint} from '@watching/clips';
import {type LocalExtension, type LocalExtensionPointSupport} from './app';

const TARGET_MAP: Record<
  ExtensionPoint,
  (support: LocalExtensionPointSupport) => string
> = {
  'Season.Details.RenderAccessory': getSeriesForExtensionPointSupport,
  'Series.Details.RenderAccessory': getSeriesForExtensionPointSupport,
  'WatchThrough.Details.RenderAccessory': () => '/app/watchthroughs/.random',
};

export async function targetForExtension(extension: LocalExtension) {
  const firstExtends = extension.extends[0];

  if (firstExtends == null) return undefined;
  return firstExtends
    ? TARGET_MAP[firstExtends.target](firstExtends)
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
