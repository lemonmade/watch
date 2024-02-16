import {createContext, useContext} from 'react';
import {
  type Api,
  type ExtensionPoint,
  type WithThreadSignals,
} from '@watching/clips';
import {type RemoteRootElement} from '@remote-dom/core/elements';

export interface ClipRenderDetails<
  Point extends ExtensionPoint = ExtensionPoint,
> {
  readonly api: WithThreadSignals<Api<Point>>;
  readonly root: RemoteRootElement;
}

export const ClipRenderContext = createContext<ClipRenderDetails | undefined>(
  undefined,
);

export function useClipRenderContext<
  Point extends ExtensionPoint = ExtensionPoint,
>() {
  const context = useContext(ClipRenderContext) as ClipRenderDetails<Point>;

  if (context == null) {
    throw new Error('Could not find the Clips render context.');
  }

  return context;
}
