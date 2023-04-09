import type {Api, ExtensionPoint, WithThreadSignals} from '@watching/clips';

import {useRenderContext} from '../context.ts';

export function useApi<
  Point extends ExtensionPoint = ExtensionPoint,
>(): WithThreadSignals<Api<Point>> {
  return useRenderContext().api as WithThreadSignals<Api<Point>>;
}
