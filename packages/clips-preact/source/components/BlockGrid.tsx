import {createRemoteComponent} from '@remote-dom/preact';
import {BlockGrid as BlockGridElement} from '@watching/clips/elements';

export const BlockGrid = createRemoteComponent(
  'ui-block-grid',
  BlockGridElement,
);
