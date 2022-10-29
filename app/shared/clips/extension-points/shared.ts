import type {
  StandardApi,
  ExtensionPoint,
  ApiForExtensionPoint,
  ComponentsForExtensionPoint,
} from '@watching/clips';
import type {ReactComponentTypeFromRemoteComponentType} from '@remote-ui/react';

export type ReactComponentsForExtensionPoint<Point extends ExtensionPoint> = {
  [Component in keyof ComponentsForExtensionPoint<Point>]: ReactComponentTypeFromRemoteComponentType<
    ComponentsForExtensionPoint<Point>[Component]
  >;
};

export interface ExtensionPointDefinition<
  Point extends ExtensionPoint,
  Options = never,
> {
  name: Point;
  api(
    options: Options,
  ): Omit<ApiForExtensionPoint<Point>, keyof StandardApi<Point>>;
  components(): ReactComponentsForExtensionPoint<Point>;
}

export function createExtensionPoint<
  Point extends ExtensionPoint,
  Options = never,
>(
  extensionPoint: ExtensionPointDefinition<Point, Options>,
): ExtensionPointDefinition<Point, Options> {
  return extensionPoint;
}
