import '@remote-dom/core/polyfill';
import {
  RemoteRootElement,
  RemoteFragmentElement,
  type RemoteConnection,
} from '@remote-dom/core/elements';
import {createTranslate} from '@quilted/localize';

import type {LocalizeApi, ApiCore} from './api.ts';
import {
  type ExtensionPoint,
  type RenderExtension,
  type RenderExtensionCore,
} from './extension-points.ts';
import {acceptSignals} from './signals.ts';

import './elements.ts';

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
  async function extension(connection: RemoteConnection, api: any) {
    const root = document.createElement('remote-root');

    const hydratedApi = acceptSignals<any>(api as any);
    const {locale, translations} = api.localize as ApiCore['localize'];
    const localize: LocalizeApi = {
      locale,
      translate: createTranslate(
        locale,
        translations ? JSON.parse(translations) : {},
      ),
    };
    hydratedApi.localize = localize;

    await (run as any)(root, hydratedApi);
    root.connect(connection);
  }

  return extension;
}
