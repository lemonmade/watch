import {useContext} from 'react';

import type {Api, ExtensionPoint, WithThreadSignals} from '@watching/clips';

import {ApiContext} from '../context';

export function useApi<
  Point extends ExtensionPoint = ExtensionPoint,
>(): WithThreadSignals<Api<Point>> {
  const api = useContext(ApiContext);

  if (api == null) {
    throw new Error('No API found in context');
  }

  return api as any;
}
