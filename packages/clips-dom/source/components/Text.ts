import {Text as BaseText} from '@watching/clips';

import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared.ts';

export const Text = 'ui-text';

export const TextComponent = createRemoteDOMComponent(BaseText, {
  properties: ['emphasis'],
});

export type UITextElement = HTMLElementForRemoteComponent<typeof BaseText>;
