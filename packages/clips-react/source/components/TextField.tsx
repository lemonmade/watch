import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {TextField as TextFieldName, TextFieldElement} from '@watching/clips';

export const TextField = createRemoteComponent(TextFieldElement, {
  element: TextFieldName,
});
