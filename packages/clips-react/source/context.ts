import {
  createOptionalContext,
  createUseContextHook,
} from '@quilted/react-utilities';
import {
  type ExtensionPoint,
  type Api,
  type Signal,
  type WithThreadSignals,
} from '@watching/clips';
import {type RemoteDOM} from '@watching/clips-dom';
import {type RemoteRoot} from '@remote-ui/core';

export {type WithThreadSignals, type Signal};

export interface RenderContext<Point extends ExtensionPoint = ExtensionPoint> {
  readonly api: WithThreadSignals<Api<Point>>;
  readonly dom: RemoteDOM;
  readonly root: RemoteRoot<any, any>;
  readonly element: Element;
}

export const ReactRenderContext = createOptionalContext<RenderContext>();
export const useRenderContext = createUseContextHook(ReactRenderContext);
