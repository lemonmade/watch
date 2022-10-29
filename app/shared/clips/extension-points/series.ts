import {CommonComponents} from '../components';
import {createExtensionPoint} from './shared';

export const SeriesDetailsRenderAccessory = createExtensionPoint({
  name: 'Series.Details.RenderAccessory',
  components() {
    return CommonComponents;
  },
});
