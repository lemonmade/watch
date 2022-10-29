import type {
  ExtensionPoint,
  ComponentsForExtensionPoint,
} from '@watching/clips';
import type {ReactComponentTypeFromRemoteComponentType} from '@remote-ui/react';

export type ReactComponentsForExtensionPoint<Point extends ExtensionPoint> = {
  [Component in keyof ComponentsForExtensionPoint<Point>]: ReactComponentTypeFromRemoteComponentType<
    ComponentsForExtensionPoint<Point>[Component]
  >;
};

export interface ExtensionPointDefinition<Point extends ExtensionPoint> {
  name: Point;
  components(): ReactComponentsForExtensionPoint<Point>;
}

export function createExtensionPoint<Point extends ExtensionPoint>(
  extensionPoint: ExtensionPointDefinition<Point>,
): ExtensionPointDefinition<Point> {
  return extensionPoint;
}
