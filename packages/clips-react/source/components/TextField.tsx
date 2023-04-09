import {TextField as BaseTextField} from '@watching/clips';
import {createRemoteReactComponent} from './shared.tsx';

export const TextField = createRemoteReactComponent(BaseTextField, {
  fragmentProps: ['label'],
});
