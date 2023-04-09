import {Action as BaseAction} from '@watching/clips';
import {createRemoteReactComponent} from './shared.tsx';

export const Action = createRemoteReactComponent(BaseAction, {
  fragmentProps: ['overlay'],
});
