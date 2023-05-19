import {createRemoteComponent} from '@lemonmade/remote-ui-preact';
import {InlineStack as InlineStackElement} from '@watching/clips/elements';

export const InlineStack = createRemoteComponent(
  'ui-inline-stack',
  InlineStackElement,
);
