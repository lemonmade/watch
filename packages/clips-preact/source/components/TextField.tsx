import {createRemoteComponent} from '@lemonmade/remote-ui-preact';
import {TextField as TextFieldElement} from '@watching/clips/elements';

export const TextField = createRemoteComponent(
  'ui-text-field',
  TextFieldElement,
);