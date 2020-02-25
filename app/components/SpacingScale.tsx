import {createRemoteReactComponent} from '@remote-ui/react';

interface Props {
  granularity: 'surfaces' | 'containers' | 'controls' | 'bits';
}

export const SpacingScale = createRemoteReactComponent<'SpacingScale', Props>(
  'SpacingScale',
);
