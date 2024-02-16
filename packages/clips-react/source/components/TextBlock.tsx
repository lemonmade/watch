import {createRemoteComponent} from '@remote-dom/react';
import {TextBlock as TextBlockElement} from '@watching/clips/elements';

export const TextBlock = createRemoteComponent(
  'ui-text-block',
  TextBlockElement,
);
