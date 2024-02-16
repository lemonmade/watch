import {createRemoteComponent} from '@remote-dom/preact';
import {TextField as TextFieldElement} from '@watching/clips/elements';

export const TextField = createRemoteComponent(
  'ui-text-field',
  TextFieldElement,
);
