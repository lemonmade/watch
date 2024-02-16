import {createRemoteComponent} from '@remote-dom/preact';
import {Disclosure as DisclosureElement} from '@watching/clips/elements';

export const Disclosure = createRemoteComponent(
  'ui-disclosure',
  DisclosureElement,
);
