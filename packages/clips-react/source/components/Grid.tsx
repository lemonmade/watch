import {
  Grid as BaseGrid,
  BlockGrid as BaseBlockGrid,
  InlineGrid as BaseInlineGrid,
} from '@watching/clips';
import {createRemoteReactComponent} from './shared';

export const Grid = createRemoteReactComponent(BaseGrid);
export const BlockGrid = createRemoteReactComponent(BaseBlockGrid);
export const InlineGrid = createRemoteReactComponent(BaseInlineGrid);
