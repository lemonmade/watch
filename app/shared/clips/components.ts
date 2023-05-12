import {type RemoteComponentRendererMap} from '@lemonmade/remote-ui-react/host';

import {Action} from './components/Action.tsx';
import {Header} from './components/Header.tsx';
import {Footer} from './components/Footer.tsx';
import {Grid, BlockGrid, InlineGrid} from './components/Grid.tsx';
import {Heading} from './components/Heading.tsx';
import {Image} from './components/Image.tsx';
import {Modal} from './components/Modal.tsx';
import {Popover} from './components/Popover.tsx';
import {Stack, BlockStack, InlineStack} from './components/Stack.tsx';
import {Section} from './components/Section.tsx';
import {Text} from './components/Text.tsx';
import {TextBlock} from './components/TextBlock.tsx';
import {TextField} from './components/TextField.tsx';
import {View} from './components/View.tsx';

import {
  type ReactComponentTypeForClipsElement,
  type ReactComponentPropsForClipsElement,
} from './components/shared.ts';

export {
  Action,
  type ReactComponentTypeForClipsElement,
  type ReactComponentPropsForClipsElement,
};

export const CommonComponents: RemoteComponentRendererMap = new Map([
  ['ui-action', Action],
  ['ui-image', Image],
  ['ui-footer', Footer],
  ['ui-header', Header],
  ['ui-heading', Heading],
  ['ui-modal', Modal],
  ['ui-popover', Popover],
  ['ui-section', Section],
  ['ui-text', Text],
  ['ui-text-block', TextBlock],
  ['ui-text-field', TextField],
  ['ui-view', View],

  // Layout
  ['ui-stack', Stack],
  ['ui-block-stack', BlockStack],
  ['ui-inline-stack', InlineStack],
  ['ui-grid', Grid],
  ['ui-block-grid', BlockGrid],
  ['ui-inline-grid', InlineGrid],
]);
