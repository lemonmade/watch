import {BlockStack as BaseBlockStack} from '@watching/clips';

import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared.ts';

export const BlockStack = 'ui-block-stack';

export const BlockStackComponent = createRemoteDOMComponent(BaseBlockStack, {
  properties: ['spacing'],
});

export type UIBlockStackElement = HTMLElementForRemoteComponent<
  typeof BaseBlockStack
>;
