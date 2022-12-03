import {createRemoteRoot} from '@remote-ui/core';
import {
  type ExtensionPoints,
  type RenderExtension,
  type RenderExtensionRoot,
  type RenderExtensionWithRemoteRoot,
} from './extension-points';
import {acceptSignals, type WithThreadSignals} from './signals';
import {type Api} from './api';

export type ExtensionPointsWithWrapper = {
  [ExtensionPoint in keyof ExtensionPoints]: ExtensionPoints[ExtensionPoint] extends RenderExtension<
    ExtensionPoint,
    any,
    infer Components
  >
    ? RenderExtensionWithRemoteRoot<
        WithThreadSignals<Api<ExtensionPoint>>,
        Components
      >
    : never;
};

export function extension<
  ExtensionPoint extends keyof ExtensionPoints = keyof ExtensionPoints,
>(
  run: ExtensionPointsWithWrapper[ExtensionPoint],
): ExtensionPoints[ExtensionPoint] {
  async function extension(
    {channel, components}: RenderExtensionRoot<any>,
    api: unknown,
  ) {
    const root = createRemoteRoot(channel, {strict: true, components});
    await (run as any)(root, acceptSignals(api));
    root.mount();
  }

  return extension;
}
