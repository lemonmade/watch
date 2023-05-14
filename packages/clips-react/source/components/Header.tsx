import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {Header as HeaderName, HeaderElement} from '@watching/clips';

export const Header = createRemoteComponent(HeaderElement, {
  element: HeaderName,
});
