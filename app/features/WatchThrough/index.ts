import {ComponentProps} from 'react';
import {createAsyncComponent} from '@quilted/quilt';

export type Props = ComponentProps<
  typeof import('./WatchThrough').WatchThrough
>;

export const WatchThrough = createAsyncComponent<Props>({
  load: () =>
    import(/* webpackChunkName: 'WatchThrough' */ './WatchThrough').then(
      ({WatchThrough}) => WatchThrough,
    ),
});
