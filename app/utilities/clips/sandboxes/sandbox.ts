import {createRemoteRoot, retain} from '@remote-ui/core';
import type {RemoteChannel} from '@remote-ui/core';
import type {Endpoint} from '@remote-ui/rpc';
import {endpoint as untypedEndpoint} from '@remote-ui/web-workers/worker';

import type {
  ClipsApi,
  Version,
  ExtensionPoint,
  ExtensionPoints,
  ApiForExtensionPoint,
} from '@watching/clips';

const registeredExtensions = new Map<
  keyof ExtensionPoints,
  ExtensionPoints[keyof ExtensionPoints]
>();

const endpoint: Endpoint<{restart(): void}> = untypedEndpoint as any;
endpoint.callable('restart');

const clips: ClipsApi = Object.freeze({
  extend(extensionPoint, extend) {
    registeredExtensions.set(extensionPoint, extend);
  },
  restart() {
    endpoint.call.restart();
  },
});

Reflect.defineProperty(self, 'clips', {
  value: clips,
  configurable: false,
  enumerable: true,
  writable: false,
});

declare const importScripts: (script: string) => void;

export function load(script: string, _: Version) {
  importScripts(script);
}

export async function render<T extends ExtensionPoint>(
  id: T,
  channel: RemoteChannel,
  components: string[],
  api: ApiForExtensionPoint<T>,
) {
  retain(channel);
  retain(api);

  const root = createRemoteRoot(channel, {components});

  // TypeScript has a very hard time understanding the various union types going on here :/
  // @ts-ignore
  let result = runExtensionPoint(id, root, api);

  if (typeof result === 'object' && result != null && 'then' in result) {
    result = await result;
  }

  root.mount();
  return result;
}

type ArgumentsForExtensionPoint<T extends ExtensionPoint> = Parameters<
  ExtensionPoints[T]
>;

type ReturnTypeForExtensionPoint<T extends ExtensionPoint> = ReturnType<
  ExtensionPoints[T]
>;

function runExtensionPoint<T extends ExtensionPoint>(
  id: T,
  ...args: ArgumentsForExtensionPoint<T>
): ReturnTypeForExtensionPoint<T> {
  return (registeredExtensions.get(id) as any)?.(...args);
}
