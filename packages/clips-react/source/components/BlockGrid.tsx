import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {BlockGrid as BlockGridElement} from '@watching/clips/elements';

export const BlockGrid = createRemoteComponent(
  'ui-block-grid',
  BlockGridElement,
);
