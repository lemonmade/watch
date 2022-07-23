import type {ExtensionPoints} from './extension-points';

export interface ClipsApi {
  register<ExtensionPoint extends keyof ExtensionPoints>(
    extensionPoint: ExtensionPoint,
    extension: ExtensionPoints[ExtensionPoint],
  ): void;
}

export interface ClipsGlobal {
  readonly clips: ClipsApi;
}

declare global {
  interface WorkerGlobalScope extends ClipsGlobal {}
}
