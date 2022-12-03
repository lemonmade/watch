import {type View as BaseView} from '@watching/clips';
import {type HTMLElementForRemoteComponent} from './shared';

export const View = 'ui-view';
export type UIViewElement = HTMLElementForRemoteComponent<typeof BaseView>;
