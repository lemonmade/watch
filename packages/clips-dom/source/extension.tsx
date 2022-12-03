import {createRemoteRoot, type RemoteRoot} from '@remote-ui/core';
import {acceptSignals, WithThreadSignals} from '@watching/clips';
import {
  Action,
  BlockStack,
  Footer,
  Header,
  Heading,
  Image,
  InlineStack,
  Modal,
  Popover,
  Section,
  Text,
  TextField,
  View,
  type ViewProps,
} from '@watching/clips';
import type {
  Api,
  ExtensionPoints,
  RenderExtensionRoot,
  ExtensionPoint,
} from '@watching/clips';

import {createWindow, createRemoteDOM, type RemoteDOM} from './dom';
import {
  Action as ActionElement,
  BlockStack as BlockStackElement,
  Footer as FooterElement,
  Header as HeaderElement,
  Heading as HeadingElement,
  Image as ImageElement,
  InlineStack as InlineStackElement,
  Modal as ModalElement,
  Popover as PopoverElement,
  Section as SectionElement,
  Text as TextElement,
  TextField as TextFieldElement,
  View as ViewElement,
} from './components';
import {createRemoteHTMLAdaptor} from './adaptor';

const REMOTE_DOM = Symbol.for('RemoteUi.DOM');

if (typeof globalThis.window === 'undefined') {
  const remoteDOM = createRemoteDOMAdaptor();
  const window = createWindow(remoteDOM);

  Object.defineProperties(globalThis, {
    ...Object.getOwnPropertyDescriptors(window),
    window: {value: window},
    [REMOTE_DOM]: {value: remoteDOM, enumerable: false},
  });

  remoteDOM.defineElements();
}

export function getRemoteDOM() {
  return (globalThis as any)[REMOTE_DOM] as RemoteDOM;
}

export function extension<Target extends ExtensionPoint>(
  renderDom: (
    element: Element,
    api: WithThreadSignals<Api<Target>>,
    context: {root: RemoteRoot<any, any>; dom: RemoteDOM},
  ) => void | Promise<void>,
) {
  async function domExtension(
    {channel, components}: RenderExtensionRoot<any>,
    api: Api<Target>,
  ) {
    const root = createRemoteRoot(channel, {components});
    const remoteDOM = getRemoteDOM();
    const element = remoteDOM.createRootElement(root);
    await renderDom(element as any, acceptSignals(api), {root, dom: remoteDOM});
    root.mount();
  }

  return domExtension as ExtensionPoints[Target];
}

function createRemoteDOMAdaptor() {
  const VIEW_PROPERTIES: (keyof ViewProps)[] = [
    'padding',
    'paddingBlockEnd',
    'paddingBlockStart',
    'paddingInlineEnd',
    'paddingInlineStart',
  ];

  return createRemoteDOM({
    elements: {
      [ActionElement]: createRemoteHTMLAdaptor(Action, {
        properties: ['to', 'disabled', 'overlay', 'onPress'],
      }),
      [BlockStackElement]: createRemoteHTMLAdaptor(BlockStack, {
        properties: ['spacing'],
      }),
      [FooterElement]: createRemoteHTMLAdaptor(Footer, {
        properties: VIEW_PROPERTIES,
      }),
      [HeaderElement]: createRemoteHTMLAdaptor(Header, {
        properties: VIEW_PROPERTIES,
      }),
      [HeadingElement]: createRemoteHTMLAdaptor(Heading, {
        properties: ['accessibilityRole', 'divider', 'level'],
      }),
      [ImageElement]: createRemoteHTMLAdaptor(Image, {
        properties: [
          'accessibilityRole',
          'aspectRatio',
          'description',
          'fit',
          'loading',
          'source',
          'sources',
        ],
      }),
      [InlineStackElement]: createRemoteHTMLAdaptor(InlineStack, {
        properties: ['spacing'],
      }),
      [ModalElement]: createRemoteHTMLAdaptor(Modal, {
        properties: ['padding'],
      }),
      [PopoverElement]: createRemoteHTMLAdaptor(Popover, {
        properties: ['blockAttachment', 'inlineAttachment'],
      }),
      [SectionElement]: createRemoteHTMLAdaptor(Section, {
        properties: VIEW_PROPERTIES,
      }),
      [TextElement]: createRemoteHTMLAdaptor(Text, {
        properties: ['emphasis'],
      }),
      [TextFieldElement]: createRemoteHTMLAdaptor(TextField, {
        properties: [
          'autocomplete',
          'changeTiming',
          'disabled',
          'id',
          'label',
          'label',
          'labelStyle',
          'maximumLines',
          'minimumLines',
          'onChange',
          'onInput',
          'placeholder',
          'readonly',
          'resize',
          'type',
          'value',
        ],
      }),
      [ViewElement]: createRemoteHTMLAdaptor(View, {
        properties: VIEW_PROPERTIES,
      }),
    },
  });
}
