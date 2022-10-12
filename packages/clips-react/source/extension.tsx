import {type ReactNode} from 'react';
import {render} from 'react-dom';

import {acceptSignals} from '@watching/clips';
import type {
  AnyApi,
  ExtensionPoints,
  RenderExtensionRoot,
  ExtensionPoint,
  ApiForExtensionPoint,
} from '@watching/clips';

import {createElementFromChannel, INTERNAL_REMOTE} from './dom';
import {ApiContext} from './context';

export function extension<Extends extends ExtensionPoint>(
  renderUi: (
    api: ApiForExtensionPoint<Extends>,
  ) => ReactNode | Promise<ReactNode>,
) {
  async function reactExtension(
    {channel}: RenderExtensionRoot<any>,
    api: AnyApi,
  ) {
    const rendered = await renderUi(api as any);
    const element = createElementFromChannel(channel);

    await new Promise<void>((resolve, reject) => {
      try {
        render(
          <ApiContext.Provider value={acceptSignals(api)}>
            {rendered}
          </ApiContext.Provider>,
          element as any as HTMLElement,
          () => {
            resolve();
          },
        );
      } catch (error) {
        reject(error);
      }
    });

    element[INTERNAL_REMOTE].root.mount();
  }

  return reactExtension as ExtensionPoints[Extends];
}
