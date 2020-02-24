import {createRemoteReactComponent} from '@remote-ui/react';

interface Props {
  id: string;
  label: string;
  value: Date;
  onChange(value: Date): void;
}

export const DateField = createRemoteReactComponent<'DateField', Props>(
  'DateField',
);
