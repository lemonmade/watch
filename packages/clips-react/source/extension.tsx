import {type ReactNode} from 'react';
import {render} from 'react-dom';

import type {Api, ExtensionPoint, WithThreadSignals} from '@watching/clips';
import {extension as domExtension} from '@watching/clips';

import {installHooks} from './signals.ts';
import {type RenderContext, ReactRenderContext} from './context.ts';

export function extension<Target extends ExtensionPoint>(
  renderReact: (
    api: WithThreadSignals<Api<Target>>,
  ) => ReactNode | Promise<ReactNode>,
) {
  installHooks();

  return domExtension<Target>(async (root, api: any) => {
    const rendered = await renderReact(api);

    const context: RenderContext<Target> = {
      api,
      root,
    };

    await new Promise<void>((resolve, reject) => {
      try {
        render(
          <ReactRenderContext.Provider value={context}>
            {rendered}
          </ReactRenderContext.Provider>,
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
