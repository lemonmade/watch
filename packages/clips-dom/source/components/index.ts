import {Action, ActionComponent, type UIActionElement} from './Action';
import {
  BlockStack,
  BlockStackComponent,
  type UIBlockStackElement,
} from './BlockStack';
import {Footer, FooterComponent, type UIFooterElement} from './Footer';
import {Header, HeaderComponent, type UIHeaderElement} from './Header';
import {Heading, HeadingComponent, type UIHeadingElement} from './Heading';
import {Image, ImageComponent, type UIImageElement} from './Image';
import {
  InlineStack,
  InlineStackComponent,
  type UIInlineStackElement,
} from './InlineStack';
import {Modal, ModalComponent, type UIModalElement} from './Modal';
import {Popover, PopoverComponent, type UIPopoverElement} from './Popover';
import {Section, SectionComponent, type UISectionElement} from './Section';
import {Text, TextComponent, type UITextElement} from './Text';
import {
  TextBlock,
  TextBlockComponent,
  type UITextBlockElement,
} from './TextBlock';
import {
  TextField,
  TextFieldComponent,
  type UITextFieldElement,
} from './TextField';
import {View, ViewComponent, type UIViewElement} from './View';

export {
  type RemoteDOMComponent,
  type HTMLConstructorForRemoteComponent,
  type HTMLElementForRemoteComponent,
} from './shared';

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
