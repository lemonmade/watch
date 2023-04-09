import {TextBlock as BaseTextBlock} from '@watching/clips';

import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared.ts';

export const TextBlock = 'ui-text-block';

export const TextBlockComponent = createRemoteDOMComponent(BaseTextBlock, {
  properties: [],
});

export type UITextBlockElement = HTMLElementForRemoteComponent<
  typeof BaseTextBlock
>;
