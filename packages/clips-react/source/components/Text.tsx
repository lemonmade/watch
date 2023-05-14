import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {Text as TextName, TextElement} from '@watching/clips';

export const Text = createRemoteComponent(TextElement, {
  element: TextName,
});
