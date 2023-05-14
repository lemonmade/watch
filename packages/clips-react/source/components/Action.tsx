import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {Action as ActionName, ActionElement} from '@watching/clips';

export const Action = createRemoteComponent(ActionElement, {
  element: ActionName,
});
