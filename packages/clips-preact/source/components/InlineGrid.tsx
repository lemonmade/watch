import {createRemoteComponent} from '@remote-dom/preact';
import {InlineGrid as InlineGridElement} from '@watching/clips/elements';

export const InlineGrid = createRemoteComponent(
  'ui-inline-grid',
  InlineGridElement,
);
