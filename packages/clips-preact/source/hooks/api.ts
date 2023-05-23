import type {Api, ExtensionPoint} from '@watching/clips';

import {useClipRenderContext} from '../context.ts';

export function useApi<
  Point extends ExtensionPoint = ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
>(): Api<Point, Query, Settings> {
  return useClipRenderContext().api as any;
}
