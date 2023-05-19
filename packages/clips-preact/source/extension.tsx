import {type ReactNode} from 'react';
import {render} from 'react-dom';

import type {Api, ExtensionPoint, WithThreadSignals} from '@watching/clips';
import {extension as domExtension} from '@watching/clips';

import {installHooks} from './signals.ts';
import {ClipRenderContext, type ClipRenderDetails} from './context.ts';

export function extension<Target extends ExtensionPoint>(
  renderPreact: (
    api: WithThreadSignals<Api<Target>>,
  ) => ReactNode | Promise<ReactNode>,
) {
  installHooks();

  return domExtension<Target>(async (root, api: any) => {
    const rendered = await renderPreact(api);

    const renderDetails: ClipRenderDetails<Target> = {
      api,
      root,
    };

    await new Promise<void>((resolve, reject) => {
      try {
        render(
          <ClipRenderContext.Provider value={renderDetails}>
            {rendered}
          </ClipRenderContext.Provider>,
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
