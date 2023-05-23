import {render, type ComponentChild} from 'preact';

import type {Api, ExtensionPoint} from '@watching/clips';
import {extension as domExtension} from '@watching/clips';

import {installHooks} from './signals.ts';
import {ClipRenderContext, type ClipRenderDetails} from './context.ts';

export function extension<
  Target extends ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
>(
  renderPreact: (
    api: Api<Target, Query, Settings>,
  ) => ComponentChild | Promise<ComponentChild>,
) {
  installHooks();

  return domExtension<Target, Query, Settings>(async (root: any, api: any) => {
    const rendered = await renderPreact(api);

    const renderDetails: ClipRenderDetails<Target> = {
      api,
      root,
    };

    render(
      <ClipRenderContext.Provider value={renderDetails}>
        {rendered}
      </ClipRenderContext.Provider>,
      root,
    );
  });
}
