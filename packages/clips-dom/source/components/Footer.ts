import {type Footer as BaseFooter} from '@watching/clips';
import {type HTMLElementForRemoteComponent} from './shared';

export const Footer = 'ui-footer';
export type UIFooterElement = HTMLElementForRemoteComponent<typeof BaseFooter>;
