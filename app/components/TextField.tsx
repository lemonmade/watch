import {createRemoteReactComponent} from '@remote-ui/react';

interface Props {
  initialValue?: string;
  multiline?: boolean;
  onChange(value: string): void;
}

export const TextField = createRemoteReactComponent<'TextField', Props>(
  'TextField',
);
