import {type CommonComponents} from '@watching/clips';

import {Action} from './Action';
import {BlockStack} from './BlockStack';
import {InlineStack} from './InlineStack';
import {Text} from './Text';
import {TextField} from './TextField';
import {View} from './View';

import {
  type ReactComponentsForExtensionPoint,
  type ReactComponentsForRemoteComponents,
} from './shared';

export {
  Action,
  type ReactComponentsForExtensionPoint,
  type ReactComponentsForRemoteComponents,
};

const Common: ReactComponentsForRemoteComponents<CommonComponents> =
  Object.freeze({
    Action,
    BlockStack,
    InlineStack,
    Text,
    TextField,
    View,
  });

export {Common as CommonComponents};