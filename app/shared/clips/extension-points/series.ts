import {CommonComponents} from '../components';
import {createExtensionPoint} from './shared';

export interface SeriesDetailsRenderAccessoryOptions {
  readonly id: string;
  readonly name: string;
}

export const SeriesDetailsRenderAccessory = createExtensionPoint({
  name: 'Series.Details.RenderAccessory',
  api({id, name}: SeriesDetailsRenderAccessoryOptions) {
    return {
      series: {id, name},
    };
  },
  components() {
    return CommonComponents;
  },
});
