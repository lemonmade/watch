import {type InlineStack as BaseInlineStack} from '@watching/clips';
import {type HTMLElementForRemoteComponent} from './shared';

export const InlineStack = 'ui-inline-stack';
export type UIInlineStackElement = HTMLElementForRemoteComponent<
  typeof BaseInlineStack
>;
