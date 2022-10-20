import {acceptSignals, WithThreadSignals} from '@watching/clips';
import type {
  AnyApi,
  ExtensionPoints,
  RenderExtensionRoot,
  ExtensionPoint,
  ApiForExtensionPoint,
} from '@watching/clips';

import {
  createWindow,
  getRemoteRootForElement,
  createRootElement,
  type Element,
} from './dom';

if (typeof globalThis.window === 'undefined') {
  const window = createWindow();

  Object.defineProperties(globalThis, {
    ...Object.getOwnPropertyDescriptors(window),
    window: {value: window},
  });
}

export function extension<Extends extends ExtensionPoint>(
  renderUi: (
    element: Element,
    api: WithThreadSignals<ApiForExtensionPoint<Extends>>,
  ) => void | Promise<void>,
) {
  async function domExtension(
    {channel}: RenderExtensionRoot<any>,
    api: AnyApi,
  ) {
    const element = createRootElement(channel, globalThis.window as any);
    await renderUi(element, acceptSignals(api) as any);
    getRemoteRootForElement(element)!.mount();
  }

  return domExtension as ExtensionPoints[Extends];
}