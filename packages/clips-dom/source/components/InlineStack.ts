import {InlineStack as BaseInlineStack} from '@watching/clips';

import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared.ts';

export const InlineStack = 'ui-inline-stack';

export const InlineStackComponent = createRemoteDOMComponent(BaseInlineStack, {
  properties: ['spacing'],
});

export type UIInlineStackElement = HTMLElementForRemoteComponent<
  typeof BaseInlineStack
>;
