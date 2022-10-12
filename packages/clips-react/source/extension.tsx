import {type ReactNode} from 'react';
import {render} from 'react-dom';

import type {
  ExtensionPoint,
  ApiForExtensionPoint,
  WithThreadSignals,
} from '@watching/clips';
import {extension as domExtension} from '@watching/clips-dom';

import {ApiContext} from './context';

export function extension<Extends extends ExtensionPoint>(
  renderUi: (
    api: WithThreadSignals<ApiForExtensionPoint<Extends>>,
  ) => ReactNode | Promise<ReactNode>,
) {
  return domExtension<Extends>(async (element, api) => {
    const rendered = await renderUi(api as any);

    await new Promise<void>((resolve, reject) => {
      try {
        render(
          <ApiContext.Provider value={api as any}>
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
  });
}
