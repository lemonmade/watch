import {createRemoteRoot} from '@remote-ui/core';
import {
  type ExtensionPoint,
  type ExtensionPoints,
  type RenderExtension,
  type RenderExtensionRoot,
  type RenderExtensionWithRemoteRoot,
} from './extension-points';
import {acceptSignals, type WithThreadSignals} from './signals';
import {type Api} from './api';

export type ExtensionPointsWithWrapper = {
  [Target in ExtensionPoint]: ExtensionPoints[Target] extends RenderExtension<
    Target,
    any,
    infer Components
  >
    ? RenderExtensionWithRemoteRoot<WithThreadSignals<Api<Target>>, Components>
    : never;
};

export function extension<Target extends ExtensionPoint>(
  run: ExtensionPointsWithWrapper[Target],
): ExtensionPoints[Target] {
  async function extension(
    {channel, components}: RenderExtensionRoot<any>,
    api: unknown,
  ) {
    const root = createRemoteRoot(channel, {strict: true, components});
    await (run as any)(root, acceptSignals(api as any));
    root.mount();
  }

  return extension;
}
