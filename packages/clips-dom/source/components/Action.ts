import {Action as BaseAction} from '@watching/clips';
import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared';

export const Action = 'ui-action';

export const ActionComponent = createRemoteDOMComponent(BaseAction, {
  properties: ['to', 'disabled', 'overlay', 'onPress'],
});

export type UIActionElement = HTMLElementForRemoteComponent<typeof BaseAction>;
