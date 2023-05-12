import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {View as ViewName, ViewElement} from '@watching/clips';

export const View = createRemoteComponent(ViewElement, {
  element: ViewName,
});
