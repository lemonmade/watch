import {CommonComponents} from '../components';
import {createExtensionPoint, createStandardGraphQLApi} from './shared';

export const WatchThroughDetailsRenderAccessory = createExtensionPoint({
  name: 'WatchThrough.Details.RenderAccessory',
  query() {
    return (options) => {
      return createStandardGraphQLApi(options);
    };
  },
  components() {
    return CommonComponents;
  },
});
