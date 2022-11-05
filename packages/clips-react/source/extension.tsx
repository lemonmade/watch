import {type ReactNode} from 'react';
import {render} from 'react-dom';

import type {Api, ExtensionPoint, WithThreadSignals} from '@watching/clips';
import {
  extension as domExtension,
  getRemoteRootForElement,
} from '@watching/clips-dom';

import {type RenderContext, ReactRenderContext} from './context';

export function extension<Point extends ExtensionPoint>(
  renderUi: (
    api: WithThreadSignals<Api<Point>>,
  ) => ReactNode | Promise<ReactNode>,
) {
  return domExtension<Point>(async (element, api) => {
    const rendered = await renderUi(api);

    const context: RenderContext<Point> = {
      api,
      element: element as any as HTMLElement,
      root: getRemoteRootForElement(element as any)!,
    };

    await new Promise<void>((resolve, reject) => {
      try {
        render(
          <ReactRenderContext.Provider value={context}>
            {rendered}
          </ReactRenderContext.Provider>,
          context.element,
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
