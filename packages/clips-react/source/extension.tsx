import type {ReactNode} from 'react';

import type {RemoteRoot} from '@remote-ui/core';
import {render as renderRemoteUi} from '@watching/remote-react-utilities';

import {extension as vanillaExtension} from '@watching/clips';
import type {
  AnyApi,
  ExtensionPoint,
  WithThreadSignals,
  ApiForExtensionPoint,
} from '@watching/clips';

import {ApiContext} from './context';

export function extension<Extends extends ExtensionPoint>(
  renderUi: (
    api: ApiForExtensionPoint<Extends>,
  ) => ReactNode | Promise<ReactNode>,
) {
  async function reactExtension(
    root: RemoteRoot<any>,
    api: WithThreadSignals<AnyApi>,
  ) {
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
  }

  return vanillaExtension<Extends>(reactExtension as any);
}
