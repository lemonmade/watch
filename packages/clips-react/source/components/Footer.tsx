import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {Footer as FooterName, FooterElement} from '@watching/clips';

export const Footer = createRemoteComponent(FooterElement, {
  element: FooterName,
});
