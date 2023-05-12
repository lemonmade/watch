import {
  retain,
  createThread,
  targetFromWebWorker,
  createBasicEncoderWithOverrides,
} from '@quilted/quilt/threads';
import {createThreadSignal} from '@watching/thread-signals';
import {type RemoteMutationCallback} from '@lemonmade/remote-ui';

import type {
  Api,
  ClipsApi,
  Version,
  ExtensionPoint,
  ExtensionPoints,
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

const sandboxApi = {
  load,
  render,
  getResourceTimingEntries,
};

export type Sandbox = typeof sandboxApi;

const createSignalEncoder = createBasicEncoderWithOverrides({
  encode(value, {encode}) {
    if (
      value != null &&
      typeof (value as any).peek === 'function' &&
      typeof (value as any).subscribe === 'function'
    ) {
      return encode(createThreadSignal(value as any, {writable: true}));
    }
  },
});

createThread<Sandbox>(targetFromWebWorker(self as any), {
  encoder: createSignalEncoder,
  expose: sandboxApi as any,
});

export async function load(script: string, _: Version) {
  importScripts(script);
}

export async function render<T extends ExtensionPoint>(
  id: T,
  callback: RemoteMutationCallback,
  components: string[],
  api: Api<T>,
) {
  retain(callback);
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

export async function getResourceTimingEntries() {
  return performance
    .getEntriesByType('resource')
    .filter((entry) => entry.name.endsWith('.js'))
    .map(
      (entry) => entry.toJSON() as Omit<PerformanceResourceTiming, 'toJSON'>,
    );
}
