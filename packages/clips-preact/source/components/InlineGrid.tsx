import {createRemoteComponent} from '@lemonmade/remote-ui-preact';
import {InlineGrid as InlineGridElement} from '@watching/clips/elements';

export const InlineGrid = createRemoteComponent(
  'ui-inline-grid',
  InlineGridElement,
);
