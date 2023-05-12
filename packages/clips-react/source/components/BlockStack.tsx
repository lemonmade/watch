import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {BlockStack as BlockStackName, BlockStackElement} from '@watching/clips';

export const BlockStack = createRemoteComponent(BlockStackElement, {
  element: BlockStackName,
});
