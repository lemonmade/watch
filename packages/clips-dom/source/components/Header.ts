import {type Header as BaseHeader} from '@watching/clips';
import {type HTMLElementForRemoteComponent} from './shared';

export const Header = 'ui-header';
export type UIHeaderElement = HTMLElementForRemoteComponent<typeof BaseHeader>;
