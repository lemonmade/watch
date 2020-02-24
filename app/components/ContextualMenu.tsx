import {createRemoteReactComponent} from '@remote-ui/react';

interface Action {
  id?: string;
  content: string;
  onPress(): void;
}

interface Props {
  actions: Action[];
}

export const ContextualMenu = createRemoteReactComponent<
  'ContextualMenu',
  Props
>('ContextualMenu');
