import {Action, type UIActionElement} from './Action';
import {BlockStack, type UIBlockStackElement} from './BlockStack';
import {Footer, type UIFooterElement} from './Footer';
import {Header, type UIHeaderElement} from './Header';
import {Heading, type UIHeadingElement} from './Heading';
import {Image, type UIImageElement} from './Image';
import {InlineStack, type UIInlineStackElement} from './InlineStack';
import {Modal, type UIModalElement} from './Modal';
import {Popover, type UIPopoverElement} from './Popover';
import {Section, type UISectionElement} from './Section';
import {Text, type UITextElement} from './Text';
import {TextField, type UITextFieldElement} from './TextField';
import {View, type UIViewElement} from './View';

export * from './shared';

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
    [TextField]: UITextFieldElement;
    [View]: UIViewElement;
  }
}

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
  TextField,
  type UITextFieldElement,
  View,
  type UIViewElement,
};
