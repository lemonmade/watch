import {createRemoteReactComponent} from '@remote-ui/react';

interface Props {
  direction?: 'inline' | 'block';
  spacing?: 'small' | 'large';
}

interface ItemProps {}

export const Stack = createRemoteReactComponent<'Stack', Props>('Stack');
export const StackItem = createRemoteReactComponent<'StackItem', ItemProps>(
  'StackItem',
);
