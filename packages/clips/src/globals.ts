import type {ExtensionPoints} from './extension-points';

export interface ClipsApi {
  extend<ExtensionPoint extends keyof ExtensionPoints>(
    extensionPoint: ExtensionPoint,
    extend: ExtensionPoints[ExtensionPoint],
  ): void;
  restart(): void;
}

declare global {
  interface WorkerGlobalScope {
    readonly clips: ClipsApi;
  }
}
