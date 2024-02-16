import {createRemoteComponent} from '@remote-dom/preact';
import {BlockStack as BlockStackElement} from '@watching/clips/elements';

export const BlockStack = createRemoteComponent(
  'ui-block-stack',
  BlockStackElement,
);
