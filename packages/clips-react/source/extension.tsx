import {extension as domExtension} from '@watching/clips';
import type {Api, ExtensionPoint} from '@watching/clips';
import '@lemonmade/remote-ui-react/polyfill';

import {type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';

import {ClipRenderContext, type ClipRenderDetails} from './context.ts';

export function extension<
  Target extends ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
>(
  renderReact: (
    api: Api<Target, Query, Settings>,
  ) => ReactNode | Promise<ReactNode>,
) {
  return domExtension<Target, Query, Settings>(async (root: any, api: any) => {
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
