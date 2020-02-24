import {createRemoteReactComponent} from '@remote-ui/react';

interface Props {
  primary?: boolean;
  onPress(): void;
}

export const Button = createRemoteReactComponent<'Button', Props>('Button');
