import {TextField as BaseTextField} from '@watching/clips';
import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared';

export const TextField = 'ui-text-field';

export const TextFieldComponent = createRemoteDOMComponent(BaseTextField, {
  properties: [
    'autocomplete',
    'changeTiming',
    'disabled',
    'id',
    'label',
    'label',
    'labelStyle',
    'maximumLines',
    'minimumLines',
    'onChange',
    'onInput',
    'placeholder',
    'readonly',
    'resize',
    'type',
    'value',
  ],
});

export type UITextFieldElement = HTMLElementForRemoteComponent<
  typeof BaseTextField
>;
