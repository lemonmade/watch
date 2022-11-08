import {type ExtensionPoint} from '@watching/clips';

import {
  type GraphQLApiByExtensionPoint,
  type ExtensionPointDefinition,
  type ExtensionPointDefinitionContext,
  type GraphQLQueryResolverByExtensionPoint,
} from './shared';

import {SeriesDetailsRenderAccessory} from './series';
import {WatchThroughDetailsRenderAccessory} from './watchthrough';

export {
  type GraphQLApiByExtensionPoint,
  type ExtensionPointDefinitionContext,
  type GraphQLQueryResolverByExtensionPoint,
};

export const EXTENSION_POINTS = extensionPoints({
  'Series.Details.RenderAccessory': SeriesDetailsRenderAccessory,
  'WatchThrough.Details.RenderAccessory': WatchThroughDetailsRenderAccessory,
});

export type ExtensionPointDefinitions = typeof EXTENSION_POINTS;
export type OptionsForExtensionPoint<Point extends ExtensionPoint> =
  ExtensionPointDefinitions[Point] extends ExtensionPointDefinition<
    any,
    infer Options
  >
    ? Options
    : never;

export type ExtensionPointDefinitionOptions = {
  [Point in ExtensionPoint]: OptionsForExtensionPoint<Point>;
};

export type ExtensionPointWithOptions = {
  [Point in ExtensionPoint]: ExtensionPointDefinitionOptions[Point] extends never
    ? never
    : Point;
}[ExtensionPoint];

function extensionPoints<
  Points extends {
    [Point in ExtensionPoint]: ExtensionPointDefinition<Point, any>;
  },
>(points: Points) {
  return points;
}
