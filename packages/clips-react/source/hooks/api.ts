import {useContext} from 'react';

import type {
  AnyApi,
  ExtensionPoint,
  ApiForExtensionPoint,
  WithThreadSignals,
} from '@watching/clips';

import {ApiContext} from '../context';

export function useApi<
  T extends ExtensionPoint = ExtensionPoint,
>(): WithThreadSignals<
  ExtensionPoint extends T ? AnyApi : ApiForExtensionPoint<T>
> {
  const api = useContext(ApiContext);

  if (api == null) {
    throw new Error('No API found in context');
  }

  return api as any;
}
