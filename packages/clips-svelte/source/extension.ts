import {extension as domExtension} from '@watching/clips';
import type {Api, ExtensionPoint} from '@watching/clips';

import type {SvelteComponent, ComponentConstructorOptions} from 'svelte';

import {ClipRenderContext} from './context.ts';

export function extension<
  Target extends ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
>(
  renderSvelte: (
    api: Api<Target, Query, Settings>,
    options: Required<Pick<ComponentConstructorOptions, 'target' | 'context'>>,
  ) => SvelteComponent | Promise<SvelteComponent>,
) {
  return domExtension<Target, Query, Settings>(async (root: any, api: any) => {
    const context = new ClipRenderContext(root, api);
    await renderSvelte(api, {target: root, context});
  });
}
