import {acceptSignals, WithThreadSignals} from '@watching/clips';
import type {
  AnyApi,
  ExtensionPoints,
  RenderExtensionRoot,
  ExtensionPoint,
  ApiForExtensionPoint,
} from '@watching/clips';

import {createElementFromChannel, INTERNAL_REMOTE} from './dom';

export function extension<Extends extends ExtensionPoint>(
  renderUi: (
    element: HTMLElement,
    api: WithThreadSignals<ApiForExtensionPoint<Extends>>,
  ) => void | Promise<void>,
) {
  async function domExtension(
    {channel}: RenderExtensionRoot<any>,
    api: AnyApi,
  ) {
    const element = createElementFromChannel(channel);
    await renderUi(element as any, acceptSignals(api) as any);
    element[INTERNAL_REMOTE].root.mount();
  }

  return domExtension as ExtensionPoints[Extends];
}
