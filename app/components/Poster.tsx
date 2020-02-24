import {createRemoteReactComponent} from '@remote-ui/react';

interface Props {
  source: string;
  accessibilityLabel?: string;
}

export const Poster = createRemoteReactComponent<'Poster', Props>('Poster');
