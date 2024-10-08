import {
  ThreadSignal,
  ThreadWebWorker,
  ThreadSerializationStructuredClone,
} from '@quilted/quilt/threads';
import {type RemoteConnection} from '@remote-dom/core';

import type {
  Api,
  ClipsApi,
  Version,
  ExtensionPoint,
  ExtensionPointsCore,
} from '@watching/clips';

const registeredExtensions = new Map<
  keyof ExtensionPointsCore,
  ExtensionPointsCore[keyof ExtensionPointsCore]
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

const sandboxAPI = {
  load,
  render,
  getResourceTimingEntries,
};

export type Sandbox = typeof sandboxAPI;

const serialization = new ThreadSerializationStructuredClone({
  serialize(value, serializeDefault) {
    if (
      value != null &&
      typeof (value as any).peek === 'function' &&
      typeof (value as any).subscribe === 'function'
    ) {
      return serializeDefault(
        ThreadSignal.serialize(value as any, {writable: true}),
      );
    }
  },
});

new ThreadWebWorker<never, Sandbox>(self as any, {
  exports: sandboxAPI,
  serialization,
});

export async function load(script: string, _: Version) {
  if (isModuleWorker()) {
    await import(script);
  } else {
    importScripts(script);
  }
}

export async function render<T extends ExtensionPoint>(
  id: T,
  connection: RemoteConnection,
  api: Api<T>,
) {
  // @ts-expect-error I can’t get TypeScript to understand the union types going on here...
  return runExtensionPoint(id, connection, api);
}

type ArgumentsForExtensionPoint<T extends ExtensionPoint> = Parameters<
  ExtensionPointsCore[T]
>;

type ReturnTypeForExtensionPoint<T extends ExtensionPoint> = ReturnType<
  ExtensionPointsCore[T]
>;

function runExtensionPoint<T extends ExtensionPoint>(
  id: T,
  ...args: ArgumentsForExtensionPoint<T>
): ReturnTypeForExtensionPoint<T> {
  return (registeredExtensions.get(id) as any)?.(...args);
}

export async function getResourceTimingEntries() {
  return performance
    .getEntriesByType('resource')
    .filter((entry) => entry.name.endsWith('.js'))
    .map(
      (entry) => entry.toJSON() as Omit<PerformanceResourceTiming, 'toJSON'>,
    );
}

let isModuleWorkerResult: boolean | undefined;

function isModuleWorker() {
  isModuleWorkerResult ??= (() => {
    try {
      importScripts('data:,');
      return false;
    } catch {
      return true;
    }
  })();

  return isModuleWorkerResult;
}
