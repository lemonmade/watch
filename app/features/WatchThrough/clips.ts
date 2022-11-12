import {
  CommonComponents,
  createExtensionPoint,
  createSharedGraphQLApi,
} from '~/shared/clips';

export const WatchThroughDetailsRenderAccessoryExtensionPoint =
  createExtensionPoint({
    name: 'WatchThrough.Details.RenderAccessory',
    query(_, options) {
      return createSharedGraphQLApi(options);
    },
    components() {
      return CommonComponents;
    },
  });
