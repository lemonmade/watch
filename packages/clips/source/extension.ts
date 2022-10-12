import {createRemoteRoot} from '@remote-ui/core';
import {
  type ExtensionPoints,
  type RenderExtension,
  type RenderExtensionRoot,
  type RenderExtensionWithRemoteRoot,
} from './extension-points';
import {acceptSignals, WithThreadSignals} from './signals';

export function extension<
  ExtensionPoint extends keyof ExtensionPoints = keyof ExtensionPoints,
>(
  run: ExtensionPoints[ExtensionPoint] extends RenderExtension<
    infer Api,
    infer Components
  >
    ? RenderExtensionWithRemoteRoot<WithThreadSignals<Api>, Components>
    : never,
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
