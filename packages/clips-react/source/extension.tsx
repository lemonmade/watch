import {type ReactNode} from 'react';
import {render} from 'react-dom';

import type {Api, ExtensionPoint, WithThreadSignals} from '@watching/clips';
import {extension as domExtension} from '@watching/clips-dom';

import {type RenderContext, ReactRenderContext} from './context';

export function extension<Target extends ExtensionPoint>(
  renderReact: (
    api: WithThreadSignals<Api<Target>>,
  ) => ReactNode | Promise<ReactNode>,
) {
  return domExtension<Target>(async (element, api, {dom, root}) => {
    const rendered = await renderReact(api);

    const context: RenderContext<Target> = {
      api,
      dom,
      root,
      element,
    };

    await new Promise<void>((resolve, reject) => {
      try {
        render(
          <ReactRenderContext.Provider value={context}>
            {rendered}
          </ReactRenderContext.Provider>,
          element,
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
