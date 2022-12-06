import {Footer as BaseFooter} from '@watching/clips';
import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared';
import {VIEW_PROPERTIES} from './View';

export const Footer = 'ui-footer';

export const FooterComponent = createRemoteDOMComponent(BaseFooter, {
  properties: VIEW_PROPERTIES,
});

export type UIFooterElement = HTMLElementForRemoteComponent<typeof BaseFooter>;
