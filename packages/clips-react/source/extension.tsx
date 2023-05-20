import {type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';

import type {Api, ExtensionPoint, WithThreadSignals} from '@watching/clips';
import {extension as domExtension} from '@watching/clips';

import {ClipRenderContext, type ClipRenderDetails} from './context.ts';

export function extension<Target extends ExtensionPoint>(
  renderReact: (
    api: WithThreadSignals<Api<Target>>,
  ) => ReactNode | Promise<ReactNode>,
) {
  return domExtension<Target>(async (root, api: any) => {
    const rendered = await renderReact(api);

    const renderDetails: ClipRenderDetails<Target> = {
      api,
      root,
    };

    createRoot(root).render(
      <ClipRenderContext.Provider value={renderDetails}>
        {rendered}
      </ClipRenderContext.Provider>,
    );
  });
}
