import {
  Stack as BaseStack,
  type StackProps,
  BlockStack as BaseBlockStack,
  InlineStack as BaseInlineStack,
} from '@watching/clips';
import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared';
import {VIEW_PROPERTIES} from './View';

export const STACK_NON_DIRECTIONAL_PROPERTIES: Exclude<
  keyof StackProps,
  'direction'
>[] = [
  'spacing',
  'inlineAlignment',
  'blockAlignment',
  'layoutMode',
  ...VIEW_PROPERTIES,
];

export const Stack = 'ui-stack';

export const StackComponent = createRemoteDOMComponent(BaseStack, {
  properties: ['direction', ...STACK_NON_DIRECTIONAL_PROPERTIES],
});

export type UIStackElement = HTMLElementForRemoteComponent<typeof BaseStack>;

export const BlockStack = 'ui-block-stack';

export const BlockStackComponent = createRemoteDOMComponent(BaseBlockStack, {
  properties: STACK_NON_DIRECTIONAL_PROPERTIES,
});

export type UIBlockStackElement = HTMLElementForRemoteComponent<
  typeof BaseBlockStack
>;

export const InlineStack = 'ui-inline-stack';

export const InlineStackComponent = createRemoteDOMComponent(BaseInlineStack, {
  properties: STACK_NON_DIRECTIONAL_PROPERTIES,
});

export type UIInlineStackElement = HTMLElementForRemoteComponent<
  typeof BaseInlineStack
>;
