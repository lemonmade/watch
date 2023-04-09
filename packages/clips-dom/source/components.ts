import {
  Action,
  ActionComponent,
  type UIActionElement,
} from './components/Action.ts';
import {
  BlockStack,
  BlockStackComponent,
  type UIBlockStackElement,
} from './components/BlockStack.ts';
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
  InlineStack,
  InlineStackComponent,
  type UIInlineStackElement,
} from './components/InlineStack.ts';
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

export {
  type RemoteDOMComponent,
  type HTMLConstructorForRemoteComponent,
  type HTMLElementForRemoteComponent,
} from './components/shared.ts';

declare global {
  interface HTMLElementTagNameMap {
    [Action]: UIActionElement;
    [BlockStack]: UIBlockStackElement;
    [Footer]: UIFooterElement;
    [Header]: UIHeaderElement;
    [Heading]: UIHeadingElement;
    [Image]: UIImageElement;
    [InlineStack]: UIInlineStackElement;
    [Modal]: UIModalElement;
    [Popover]: UIPopoverElement;
    [Section]: UISectionElement;
    [Text]: UITextElement;
    [TextBlock]: UITextBlockElement;
    [TextField]: UITextFieldElement;
    [View]: UIViewElement;
  }
}

export const CUSTOM_ELEMENTS = {
  [Action]: ActionComponent,
  [BlockStack]: BlockStackComponent,
  [Footer]: FooterComponent,
  [Header]: HeaderComponent,
  [Heading]: HeadingComponent,
  [Image]: ImageComponent,
  [InlineStack]: InlineStackComponent,
  [Modal]: ModalComponent,
  [Popover]: PopoverComponent,
  [Section]: SectionComponent,
  [Text]: TextComponent,
  [TextBlock]: TextBlockComponent,
  [TextField]: TextFieldComponent,
  [View]: ViewComponent,
};

export {
  Action,
  type UIActionElement,
  BlockStack,
  type UIBlockStackElement,
  Footer,
  type UIFooterElement,
  Header,
  type UIHeaderElement,
  Heading,
  type UIHeadingElement,
  Image,
  type UIImageElement,
  InlineStack,
  type UIInlineStackElement,
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
};
