import type {ReactNode} from 'react';

import type {RemoteRoot} from '@remote-ui/core';
import {render as renderRemoteUi} from '@remote-ui/react';

import type {
  AnyApi,
  ExtensionPoint,
  ExtensionPoints,
  ApiForExtensionPoint,
} from '@watching/clips';

import {ApiContext} from './context';

export function render<T extends ExtensionPoint>(
  renderUi: (api: ApiForExtensionPoint<T>) => ReactNode,
): ExtensionPoints[T] {
  return (root: RemoteRoot<any>, api: AnyApi) => {
    renderRemoteUi(
      <ApiContext.Provider value={api}>
        {renderUi(api as any)}
      </ApiContext.Provider>,
      root,
      () => {
        root.mount();
      },
    );
  };
}
