import '@lemonmade/remote-ui/polyfill';
import {
  RemoteRootElement,
  RemoteFragmentElement,
  type RemoteMutationCallback,
} from '@lemonmade/remote-ui/elements';

import {
  type ExtensionPoint,
  type ExtensionPoints,
  type RenderExtension,
  type RenderExtensionWithRemoteRoot,
} from './extension-points.ts';
import {acceptSignals, type WithThreadSignals} from './signals.ts';
import {type Api} from './api.ts';

customElements.define('remote-root', RemoteRootElement);
customElements.define('remote-fragment', RemoteFragmentElement);

declare global {
  interface HTMLElementTagNameMap {
    'remote-root': RemoteRootElement;
    'remote-fragment': RemoteFragmentElement;
  }
}

export type ExtensionPointsWithWrapper = {
  [Target in ExtensionPoint]: ExtensionPoints[Target] extends RenderExtension<
    Target,
    infer GraphQLApi
  >
    ? RenderExtensionWithRemoteRoot<WithThreadSignals<Api<Target>>, GraphQLApi>
    : never;
};

export function extension<Target extends ExtensionPoint>(
  run: ExtensionPointsWithWrapper[Target],
): ExtensionPoints[Target] {
  async function extension(callback: RemoteMutationCallback, api: unknown) {
    const root = document.createElement('remote-root');
    await (run as any)(root, acceptSignals(api as any));
    root.connect(callback);
  }

  return extension;
}
