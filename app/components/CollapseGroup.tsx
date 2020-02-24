import {createRemoteReactComponent} from '@remote-ui/react';

interface Props {
  title: string;
}

export const CollapseGroup = createRemoteReactComponent<'CollapseGroup', Props>(
  'CollapseGroup',
);
