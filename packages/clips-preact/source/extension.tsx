import {render, type ComponentChild} from 'preact';

import type {Api, ExtensionPoint, WithThreadSignals} from '@watching/clips';
import {extension as domExtension} from '@watching/clips';

import {installHooks} from './signals.ts';
import {ClipRenderContext, type ClipRenderDetails} from './context.ts';

export function extension<Target extends ExtensionPoint>(
  renderPreact: (
    api: WithThreadSignals<Api<Target>>,
  ) => ComponentChild | Promise<ComponentChild>,
) {
  installHooks();

  return domExtension<Target>(async (root, api: any) => {
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
