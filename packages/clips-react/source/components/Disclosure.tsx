import {createRemoteComponent} from '@remote-dom/react';
import {Disclosure as DisclosureElement} from '@watching/clips/elements';

export const Disclosure = createRemoteComponent(
  'ui-disclosure',
  DisclosureElement,
);
