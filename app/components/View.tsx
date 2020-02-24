import {createRemoteReactComponent} from '@remote-ui/react';

interface Props {
  onPress?(): void | Promise<void>;
}

export const View = createRemoteReactComponent<'View', Props>('View');
