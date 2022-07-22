import type {ExtensionPoints} from './extension-points';

export interface ClipsApi {
  extend<ExtensionPoint extends keyof ExtensionPoints>(
    extensionPoint: ExtensionPoint,
    extend: ExtensionPoints[ExtensionPoint],
  ): void;
}

export interface ClipsGlobal {
  readonly clips: ClipsApi;
}

declare global {
  interface WorkerGlobalScope extends ClipsGlobal {}
}
