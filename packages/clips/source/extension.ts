import '@lemonmade/remote-ui/polyfill';
import {
  RemoteRootElement,
  RemoteFragmentElement,
  type RemoteMutationCallback,
} from '@lemonmade/remote-ui/elements';

import {
  type ExtensionPoint,
  type RenderExtension,
  type RenderExtensionCore,
} from './extension-points.ts';
import {acceptSignals} from './signals.ts';

customElements.define('remote-root', RemoteRootElement);
customElements.define('remote-fragment', RemoteFragmentElement);

declare global {
  interface HTMLElementTagNameMap {
    'remote-root': RemoteRootElement;
    'remote-fragment': RemoteFragmentElement;
  }
}

export function extension<
  Target extends ExtensionPoint = ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
>(
  run: RenderExtension<Target, Query, Settings>,
): RenderExtensionCore<Target, Query, Settings> {
  async function extension(callback: RemoteMutationCallback, api: unknown) {
    const root = document.createElement('remote-root');
    await (run as any)(root, acceptSignals(api as any));
    root.connect(callback);
  }

  return extension;
}
