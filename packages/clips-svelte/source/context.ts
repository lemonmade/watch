import {getContext} from 'svelte';
import {type Api, type ExtensionPoint} from '@watching/clips';
import {type RemoteRootElement} from '@remote-dom/core/elements';

export interface ClipRenderDetails<
  Point extends ExtensionPoint = ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
> {
  readonly api: Api<Point, Query, Settings>;
  readonly root: RemoteRootElement;
}

export const CLIP_RENDER_CONTEXT = 'clips.render';

export class ClipRenderContext extends Map<any, any> {
  constructor(root: RemoteRootElement, api: Api<any, any, any>) {
    super([[CLIP_RENDER_CONTEXT, {api, root}]]);
  }
}

export function getRenderContext<
  Point extends ExtensionPoint = ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
>() {
  return getContext<ClipRenderDetails<Point, Query, Settings>>(
    CLIP_RENDER_CONTEXT,
  );
}

export function getApi<
  Point extends ExtensionPoint = ExtensionPoint,
  Query = Record<string, unknown>,
  Settings = Record<string, unknown>,
>() {
  return getRenderContext<Point, Query, Settings>().api;
}

export function getTranslate() {
  return getRenderContext().api.localize.translate;
}
