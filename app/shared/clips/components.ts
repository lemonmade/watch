import {type CommonComponents} from '@watching/clips';

import {Action} from './components/Action.tsx';
import {BlockStack} from './components/BlockStack.tsx';
import {Header} from './components/Header.tsx';
import {Footer} from './components/Footer.tsx';
import {Heading} from './components/Heading.tsx';
import {Image} from './components/Image.tsx';
import {InlineStack} from './components/InlineStack.tsx';
import {Modal} from './components/Modal.tsx';
import {Popover} from './components/Popover.tsx';
import {Section} from './components/Section.tsx';
import {Text} from './components/Text.tsx';
import {TextBlock} from './components/TextBlock.tsx';
import {TextField} from './components/TextField.tsx';
import {View} from './components/View.tsx';

import {
  type PropsForClipsComponent,
  type ReactComponentsForExtensionPoint,
  type ReactComponentsForRemoteComponents,
  type ReactPropsFromRemoteComponentType,
  type ReactComponentTypeFromRemoteComponentType,
} from './components/shared.ts';

export {
  Action,
  type PropsForClipsComponent,
  type ReactComponentsForExtensionPoint,
  type ReactComponentsForRemoteComponents,
  type ReactPropsFromRemoteComponentType,
  type ReactComponentTypeFromRemoteComponentType,
};

const Common: ReactComponentsForRemoteComponents<CommonComponents> =
  Object.freeze({
    Action,
    BlockStack,
    Image,
    Footer,
    Header,
    Heading,
    InlineStack,
    Modal,
    Popover,
    Section,
    Text,
    TextBlock,
    TextField,
    View,
  });

export {Common as CommonComponents};
