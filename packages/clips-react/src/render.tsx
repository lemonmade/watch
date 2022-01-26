import type {ReactNode} from 'react';

import type {RemoteRoot} from '@remote-ui/core';
import {render as renderRemoteUi} from '@remote-ui/react';

import {extend} from '@watching/clips';
import type {
  AnyApi,
  ExtensionPoint,
  ApiForExtensionPoint,
} from '@watching/clips';

import {ApiContext} from './context';

export function render<T extends ExtensionPoint>(
  renderUi: (api: ApiForExtensionPoint<T>) => ReactNode,
) {
  return extend<T>(async (root: RemoteRoot<any>, api: AnyApi) => {
    await new Promise<void>((resolve, reject) => {
      try {
        renderRemoteUi(
          <ApiContext.Provider value={api}>
            {renderUi(api as any)}
          </ApiContext.Provider>,
          root,
          () => {
            resolve();
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  });
}
