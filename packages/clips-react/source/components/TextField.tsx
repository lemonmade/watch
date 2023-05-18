import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {TextField as TextFieldElement} from '@watching/clips/elements';

export const TextField = createRemoteComponent(
  'ui-text-field',
  TextFieldElement,
);
