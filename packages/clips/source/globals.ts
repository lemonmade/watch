import type {ExtensionPointsCore} from './extension-points.ts';

export interface ClipsApi {
  register<ExtensionPoint extends keyof ExtensionPointsCore>(
    extensionPoint: ExtensionPoint,
    extension: ExtensionPointsCore<any, any>[ExtensionPoint],
  ): void;
}

export interface ClipsGlobal {
  readonly clips: ClipsApi;
}

declare global {
  interface WorkerGlobalScope extends ClipsGlobal {}
}
