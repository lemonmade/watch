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
import {type RemoteRootElement} from '@lemonmade/remote-ui/elements';

export {type WithThreadSignals, type Signal};

export interface RenderContext<Point extends ExtensionPoint = ExtensionPoint> {
  readonly api: WithThreadSignals<Api<Point>>;
  readonly root: RemoteRootElement;
}

export const ReactRenderContext = createOptionalContext<RenderContext>();
export const useRenderContext = createUseContextHook(ReactRenderContext);
