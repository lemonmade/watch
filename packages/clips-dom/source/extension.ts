import {createRemoteRoot, type RemoteRoot} from '@remote-ui/core';
import {acceptSignals, WithThreadSignals} from '@watching/clips';
import type {
  Api,
  ExtensionPoints,
  RenderExtensionRoot,
  ExtensionPoint,
} from '@watching/clips';

import {createWindow, createRemoteDOM, type RemoteDOM} from './dom.ts';
import {CUSTOM_ELEMENTS} from './components.ts';

const REMOTE_DOM = Symbol.for('RemoteUi.DOM');

if (typeof globalThis.window === 'undefined') {
  const remoteDOM = createRemoteDOM({
    elements: CUSTOM_ELEMENTS,
  });

  const window = createWindow(remoteDOM);

  Object.defineProperties(globalThis, {
    ...Object.getOwnPropertyDescriptors(window),
    window: {value: window},
    [REMOTE_DOM]: {value: remoteDOM, enumerable: false},
  });

  remoteDOM.defineElements();
}

export function getRemoteDOM() {
  return (globalThis as any)[REMOTE_DOM] as RemoteDOM;
}

export function extension<Target extends ExtensionPoint>(
  renderDom: (
    element: Element,
    api: WithThreadSignals<Api<Target>>,
    context: {root: RemoteRoot<any, any>; dom: RemoteDOM},
  ) => void | Promise<void>,
) {
  async function domExtension(
    {channel, components}: RenderExtensionRoot<any>,
    api: Api<Target>,
  ) {
    const root = createRemoteRoot(channel, {components});
    const remoteDOM = getRemoteDOM();
    const element = remoteDOM.createRootElement(root);
    await renderDom(element as any, acceptSignals(api), {root, dom: remoteDOM});
    root.mount();
  }

  return domExtension as ExtensionPoints[Target];
}
