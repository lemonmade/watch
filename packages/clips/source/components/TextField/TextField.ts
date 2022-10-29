import {createRemoteComponent} from '@remote-ui/core';
import {type SignalOrValue} from '../shared';

export interface TextFieldProps {
  label: string;
  value?: SignalOrValue<string | undefined>;
}

/**
 * TextField is used to collect text input from a user.
 */
export const TextField = createRemoteComponent<'TextField', TextFieldProps>(
  'TextField',
);
