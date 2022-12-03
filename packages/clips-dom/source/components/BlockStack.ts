import {type BlockStack as BaseBlockStack} from '@watching/clips';
import {type HTMLElementForRemoteComponent} from './shared';

export const BlockStack = 'ui-block-stack';
export type UIBlockStackElement = HTMLElementForRemoteComponent<
  typeof BaseBlockStack
>;
