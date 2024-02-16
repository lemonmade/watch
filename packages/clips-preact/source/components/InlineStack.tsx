import {createRemoteComponent} from '@remote-dom/preact';
import {InlineStack as InlineStackElement} from '@watching/clips/elements';

export const InlineStack = createRemoteComponent(
  'ui-inline-stack',
  InlineStackElement,
);
