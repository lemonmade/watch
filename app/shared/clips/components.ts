import {RemoteFragmentRenderer} from '@remote-dom/preact/host';
import {type RemoteComponentRendererMap} from '@remote-dom/react/host';

import {Button} from './components/Button.tsx';
import {BlockGrid} from './components/BlockGrid.tsx';
import {BlockStack} from './components/BlockStack.tsx';
import {Disclosure} from './components/Disclosure.tsx';
import {Header} from './components/Header.tsx';
import {Footer} from './components/Footer.tsx';
import {Grid} from './components/Grid.tsx';
import {Heading} from './components/Heading.tsx';
import {Image} from './components/Image.tsx';
import {InlineGrid} from './components/InlineGrid.tsx';
import {InlineStack} from './components/InlineStack.tsx';
import {Modal} from './components/Modal.tsx';
import {Popover} from './components/Popover.tsx';
import {Section} from './components/Section.tsx';
import {SkeletonButton} from './components/SkeletonButton.tsx';
import {SkeletonText} from './components/SkeletonText.tsx';
import {SkeletonTextBlock} from './components/SkeletonTextBlock.tsx';
import {SkeletonView} from './components/SkeletonView.tsx';
import {Stack} from './components/Stack.tsx';
import {Text} from './components/Text.tsx';
import {TextBlock} from './components/TextBlock.tsx';
import {TextField} from './components/TextField.tsx';
import {View} from './components/View.tsx';

import {
  type PreactComponentTypeForClipsElement,
  type PreactComponentPropsForClipsElement,
} from './components/shared.ts';

export {
  type PreactComponentTypeForClipsElement,
  type PreactComponentPropsForClipsElement,
};

export const CommonComponents: RemoteComponentRendererMap = new Map([
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

  // Interaction
  ['ui-button', Button],
  ['ui-disclosure', Disclosure],

  // Layout
  ['ui-stack', Stack],
  ['ui-block-stack', BlockStack],
  ['ui-inline-stack', InlineStack],
  ['ui-grid', Grid],
  ['ui-block-grid', BlockGrid],
  ['ui-inline-grid', InlineGrid],

  // Skeletons
  ['ui-skeleton-button', SkeletonButton],
  ['ui-skeleton-text', SkeletonText],
  ['ui-skeleton-text-block', SkeletonTextBlock],
  ['ui-skeleton-view', SkeletonView],

  // remote-ui primitives
  ['remote-fragment', RemoteFragmentRenderer as any],
]);
