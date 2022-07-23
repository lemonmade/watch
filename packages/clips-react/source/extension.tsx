import type {ReactNode} from 'react';

import type {RemoteRoot} from '@remote-ui/core';
import {render as renderRemoteUi} from '@watching/remote-react-utilities';

import {extension as vanillaExtension} from '@watching/clips';
import type {
  AnyApi,
  ExtensionPoint,
  ApiForExtensionPoint,
} from '@watching/clips';

import {ApiContext} from './context';

export function extension<ID extends ExtensionPoint>(
  renderUi: (api: ApiForExtensionPoint<ID>) => ReactNode | Promise<ReactNode>,
) {
  return vanillaExtension<ID>(async (root: RemoteRoot<any>, api: AnyApi) => {
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
