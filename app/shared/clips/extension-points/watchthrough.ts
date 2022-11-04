import {CommonComponents} from '../components';
import {createExtensionPoint, createSharedGraphQLApi} from './shared';

export const WatchThroughDetailsRenderAccessory = createExtensionPoint({
  name: 'WatchThrough.Details.RenderAccessory',
  query() {
    return (options) => {
      return createSharedGraphQLApi(options);
    };
  },
  components() {
    return CommonComponents;
  },
});
