import type {Api, ExtensionPoint, WithThreadSignals} from '@watching/clips';

import {useClipRenderContext} from '../context.ts';

export function useApi<
  Point extends ExtensionPoint = ExtensionPoint,
>(): WithThreadSignals<Api<Point>> {
  return useClipRenderContext().api as WithThreadSignals<Api<Point>>;
}
