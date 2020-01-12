import {createRemoteComponent} from '@remote-ui/react';

interface Props {
  onPress?(): void | Promise<void>;
}

export const View = createRemoteComponent<'View', Props>('View');
