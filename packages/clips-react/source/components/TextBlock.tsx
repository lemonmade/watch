import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {TextBlock as TextBlockElement} from '@watching/clips/elements';

export const TextBlock = createRemoteComponent(
  'ui-text-block',
  TextBlockElement,
);
