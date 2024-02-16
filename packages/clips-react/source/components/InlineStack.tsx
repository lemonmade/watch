import {createRemoteComponent} from '@remote-dom/react';
import {InlineStack as InlineStackElement} from '@watching/clips/elements';

export const InlineStack = createRemoteComponent(
  'ui-inline-stack',
  InlineStackElement,
);
