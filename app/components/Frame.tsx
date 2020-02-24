import {ComponentProps} from 'react';
import {createRemoteReactComponent} from '@remote-ui/react';

import {Link} from './Link';

interface Action {
  to: ComponentProps<typeof Link>['to'];
  content: string;
}

interface Props {
  actions: Action[];
}

export const Frame = createRemoteReactComponent<'Frame', Props>('Frame');
