import {createRemoteComponent, type RemoteFragment} from '@remote-ui/core';
import {type SignalOrValue} from '../shared';

export type TextFieldType = 'text' | 'email';
export type TextFieldLabelStyle = 'default' | 'placeholder';
export type TextFieldChangeTiming = 'commit' | 'input';
export type TextFieldAutocompleteTarget = 'username' | 'email' | 'webauthn';

export interface TextFieldProps {
  id?: string;
  type?: TextFieldType;
  multiline?: boolean | number;
  blockSize?: 'fit';
  label: string | RemoteFragment<any>;
  labelStyle?: TextFieldLabelStyle;
  placeholder?: string;
  value?: SignalOrValue<string | undefined>;
  disabled?: SignalOrValue<boolean>;
  readonly?: SignalOrValue<boolean>;
  autocomplete?:
    | TextFieldAutocompleteTarget
    | `${TextFieldAutocompleteTarget} ${TextFieldAutocompleteTarget}`;
  changeTiming?: TextFieldChangeTiming;
  onChange?(value: string): void;
  onInput?(value: string): void;
}

/**
 * TextField is used to collect text input from a user.
 */
export const TextField = createRemoteComponent<'TextField', TextFieldProps>(
  'TextField',
);
