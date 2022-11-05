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
import {type RemoteRoot} from '@remote-ui/core';

export {type WithThreadSignals, type Signal};

export interface RenderContext<Point extends ExtensionPoint = ExtensionPoint> {
  readonly element: Element;
  readonly root: RemoteRoot<any, any>;
  readonly api: WithThreadSignals<Api<Point>>;
}

export const ReactRenderContext = createOptionalContext<RenderContext>();
export const useRenderContext = createUseContextHook(ReactRenderContext);
