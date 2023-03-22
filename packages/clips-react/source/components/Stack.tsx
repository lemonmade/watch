import {
  Stack as BaseStack,
  BlockStack as BaseBlockStack,
  InlineStack as BaseInlineStack,
} from '@watching/clips';
import {createRemoteReactComponent} from './shared';

export const Stack = createRemoteReactComponent(BaseStack);
export const BlockStack = createRemoteReactComponent(BaseBlockStack);
export const InlineStack = createRemoteReactComponent(BaseInlineStack);
