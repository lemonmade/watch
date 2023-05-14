import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {Stack as StackName, StackElement} from '@watching/clips';

export const Stack = createRemoteComponent(StackElement, {
  element: StackName,
});
