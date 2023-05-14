import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {InlineGrid as InlineGridName, InlineGridElement} from '@watching/clips';

export const InlineGrid = createRemoteComponent(InlineGridElement, {
  element: InlineGridName,
});
