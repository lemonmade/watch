import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {
  InlineStack as InlineStackName,
  InlineStackElement,
} from '@watching/clips';

export const InlineStack = createRemoteComponent(InlineStackElement, {
  element: InlineStackName,
});
