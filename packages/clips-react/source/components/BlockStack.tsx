import {createRemoteComponent} from '@remote-dom/react';
import {BlockStack as BlockStackElement} from '@watching/clips/elements';

export const BlockStack = createRemoteComponent(
  'ui-block-stack',
  BlockStackElement,
);
