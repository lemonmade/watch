import {TextField as BaseTextField} from '@watching/clips';
import {createRemoteReactComponent} from './shared';

export const TextField = createRemoteReactComponent(BaseTextField, {
  fragmentProps: ['label'],
});
