import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {BlockGrid as BlockGridName, BlockGridElement} from '@watching/clips';

export const BlockGrid = createRemoteComponent(BlockGridElement, {
  element: BlockGridName,
});
