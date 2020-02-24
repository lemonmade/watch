import {createRemoteReactComponent} from '@remote-ui/react';

interface Props {
  value?: number;
  onChange?(value: number): void;
}

export const Rating = createRemoteReactComponent<'Rating', Props>('Rating');
