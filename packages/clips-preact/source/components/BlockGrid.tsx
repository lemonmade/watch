import {createRemoteComponent} from '@lemonmade/remote-ui-preact';
import {BlockGrid as BlockGridElement} from '@watching/clips/elements';

export const BlockGrid = createRemoteComponent(
  'ui-block-grid',
  BlockGridElement,
);
