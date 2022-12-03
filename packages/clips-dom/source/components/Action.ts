import {type Action as BaseAction} from '@watching/clips';
import {type HTMLElementForRemoteComponent} from './shared';

export const Action = 'ui-action';
export type UIActionElement = HTMLElementForRemoteComponent<typeof BaseAction>;
