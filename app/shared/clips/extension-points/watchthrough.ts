import {CommonComponents} from '../components';
import {createExtensionPoint} from './shared';

export const WatchThroughDetailsRenderAccessory = createExtensionPoint({
  name: 'WatchThrough.Details.RenderAccessory',
  components() {
    return CommonComponents;
  },
});
