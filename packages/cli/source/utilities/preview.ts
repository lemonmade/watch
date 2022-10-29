import {type ExtensionPoint} from '@watching/clips';

import {watchUrl} from './url';
import {type LocalExtension, type LocalExtensionPointSupport} from './app';

const TARGET_MAP: Record<
  ExtensionPoint,
  (support: LocalExtensionPointSupport) => string
> = {
  'Series.Details.RenderAccessory': getSeriesForExtensionPointSupport,
  'WatchThrough.Details.RenderAccessory': () => '/app/watchthrough/.random',
};

export const DEFAULT_PREVIEW_PATH = '/app/developer/console';

export async function previewUrl(
  extension: LocalExtension,
  {
    connect,
    extensionPoint,
  }: {
    extensionPoint?: LocalExtensionPointSupport;
    connect?: URL | false;
  },
) {
  const target = await targetForExtension(extension, extensionPoint);
  const previewUrl = watchUrl(target ?? DEFAULT_PREVIEW_PATH);
  return connect ? addConnectSearchParam(previewUrl, connect) : previewUrl;
}

export function addConnectSearchParam(url: URL, connect: URL) {
  const connectUrl = new URL('/connect', connect);
  connectUrl.protocol = connectUrl.protocol.replace(/^http/, 'ws');

  url.searchParams.set('connect', connectUrl.href);

  return url;
}

async function targetForExtension(
  extension: LocalExtension,
  extensionPoint = extension.extends[0],
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
