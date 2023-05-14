import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {TextBlock as TextBlockName, TextBlockElement} from '@watching/clips';

export const TextBlock = createRemoteComponent(TextBlockElement, {
  element: TextBlockName,
});
