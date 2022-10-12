import {retain} from '@quilted/quilt/threads';
import {type RemoteChannel} from '@remote-ui/core';

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

const clips: ClipsApi = Object.freeze({
  register(extensionPoint, extend) {
    registeredExtensions.set(extensionPoint, extend);
  },
} as ClipsApi);

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

  // @ts-expect-error I can’t get TypeScript to understand the union types going on here...
  return runExtensionPoint(id, {channel, components}, api);
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

export function getResourceTimingEntries() {
  return performance
    .getEntriesByType('resource')
    .filter((entry) => entry.name.endsWith('.js'))
    .map(
      (entry) => entry.toJSON() as Omit<PerformanceResourceTiming, 'toJSON'>,
    );
}
