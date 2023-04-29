import '@lemonmade/remote-ui/polyfill';

export * from '@watching/clips';
export {
  type UIViewElement,
  type HTMLElementForRemoteComponent,
  type HTMLConstructorForRemoteComponent,
  Action,
  type UIActionElement,
  Footer,
  type UIFooterElement,
  Header,
  type UIHeaderElement,
  Heading,
  type UIHeadingElement,
  Image,
  type UIImageElement,
  Modal,
  type UIModalElement,
  Popover,
  type UIPopoverElement,
  Section,
  type UISectionElement,
  Text,
  type UITextElement,
  TextBlock,
  type UITextBlockElement,
  TextField,
  type UITextFieldElement,
  View,

  // Layout
  Stack,
  type UIStackElement,
  BlockStack,
  type UIBlockStackElement,
  InlineStack,
  type UIInlineStackElement,
  Grid,
  type UIGridElement,
  BlockGrid,
  type UIBlockGridElement,
  InlineGrid,
  type UIInlineGridElement,
} from './components.ts';
export {extension} from './extension.ts';
export {type RemoteDOM} from './dom.ts';
