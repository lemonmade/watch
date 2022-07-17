import type {ReactNode} from 'react';

import type {RemoteRoot} from '@remote-ui/core';
import {render as renderRemoteUi} from '@watching/remote-react-utilities';

import {extend} from '@watching/clips';
import type {
  AnyApi,
  ExtensionPoint,
  ApiForExtensionPoint,
} from '@watching/clips';

import {ApiContext} from './context';

export function render<T extends ExtensionPoint>(
  renderUi: (api: ApiForExtensionPoint<T>) => ReactNode | Promise<ReactNode>,
) {
  return extend<T>(async (root: RemoteRoot<any>, api: AnyApi) => {
    const rendered = await renderUi(api as any);

    await new Promise<void>((resolve, reject) => {
      try {
        renderRemoteUi(
          <ApiContext.Provider value={api}>{rendered}</ApiContext.Provider>,
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
