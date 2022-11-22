import {type CommonComponents} from '@watching/clips';

import {Action} from './Action';
import {BlockStack} from './BlockStack';
import {Header} from './Header';
import {Footer} from './Footer';
import {Heading} from './Heading';
import {Image} from './Image';
import {InlineStack} from './InlineStack';
import {Modal} from './Modal';
import {Popover} from './Popover';
import {Section} from './Section';
import {Text} from './Text';
import {TextField} from './TextField';
import {View} from './View';

import {
  type PropsForClipsComponent,
  type ReactComponentsForExtensionPoint,
  type ReactComponentsForRemoteComponents,
} from './shared';

export {
  Action,
  type PropsForClipsComponent,
  type ReactComponentsForExtensionPoint,
  type ReactComponentsForRemoteComponents,
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
    TextField,
    View,
  });

export {Common as CommonComponents};
