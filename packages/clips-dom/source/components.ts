import {
  Action,
  ActionComponent,
  type UIActionElement,
} from './components/Action.ts';
import {
  Footer,
  FooterComponent,
  type UIFooterElement,
} from './components/Footer.ts';
import {
  Header,
  HeaderComponent,
  type UIHeaderElement,
} from './components/Header.ts';
import {
  Heading,
  HeadingComponent,
  type UIHeadingElement,
} from './components/Heading.ts';
import {
  Image,
  ImageComponent,
  type UIImageElement,
} from './components/Image.ts';
import {
  Modal,
  ModalComponent,
  type UIModalElement,
} from './components/Modal.ts';
import {
  Popover,
  PopoverComponent,
  type UIPopoverElement,
} from './components/Popover.ts';
import {
  Section,
  SectionComponent,
  type UISectionElement,
} from './components/Section.ts';
import {Text, TextComponent, type UITextElement} from './components/Text.ts';
import {
  TextBlock,
  TextBlockComponent,
  type UITextBlockElement,
} from './components/TextBlock.ts';
import {
  TextField,
  TextFieldComponent,
  type UITextFieldElement,
} from './components/TextField.ts';
import {View, ViewComponent, type UIViewElement} from './components/View.ts';

// Layout
import {
  Stack,
  StackComponent,
  type UIStackElement,
  BlockStack,
  BlockStackComponent,
  type UIBlockStackElement,
  InlineStack,
  InlineStackComponent,
  type UIInlineStackElement,
} from './components/Stack.ts';
import {
  Grid,
  GridComponent,
  type UIGridElement,
  BlockGrid,
  BlockGridComponent,
  type UIBlockGridElement,
  InlineGrid,
  InlineGridComponent,
  type UIInlineGridElement,
} from './components/Grid.ts';

export {
  type RemoteDOMComponent,
  type HTMLConstructorForRemoteComponent,
  type HTMLElementForRemoteComponent,
} from './components/shared.ts';

declare global {
  interface HTMLElementTagNameMap {
    [Action]: UIActionElement;
    [Footer]: UIFooterElement;
    [Header]: UIHeaderElement;
    [Heading]: UIHeadingElement;
    [Image]: UIImageElement;
    [Modal]: UIModalElement;
    [Popover]: UIPopoverElement;
    [Section]: UISectionElement;
    [Text]: UITextElement;
    [TextBlock]: UITextBlockElement;
    [TextField]: UITextFieldElement;
    [View]: UIViewElement;

    // Layout
    [Stack]: UIStackElement;
    [BlockStack]: UIBlockStackElement;
    [InlineStack]: UIInlineStackElement;
    [Grid]: UIGridElement;
    [BlockGrid]: UIBlockGridElement;
    [InlineGrid]: UIInlineGridElement;
  }
}

export const CUSTOM_ELEMENTS = {
  [Action]: ActionComponent,
  [Footer]: FooterComponent,
  [Header]: HeaderComponent,
  [Heading]: HeadingComponent,
  [Image]: ImageComponent,
  [Modal]: ModalComponent,
  [Popover]: PopoverComponent,
  [Section]: SectionComponent,
  [Text]: TextComponent,
  [TextBlock]: TextBlockComponent,
  [TextField]: TextFieldComponent,
  [View]: ViewComponent,

  // Layout
  [Stack]: StackComponent,
  [BlockStack]: BlockStackComponent,
  [InlineStack]: InlineStackComponent,
  [Grid]: GridComponent,
  [BlockGrid]: BlockGridComponent,
  [InlineGrid]: InlineGridComponent,
};

export {
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
  type UIViewElement,

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
};
