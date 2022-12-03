import {type Popover as BasePopover} from '@watching/clips';
import {type HTMLElementForRemoteComponent} from './shared';

export const Popover = 'ui-popover';
export type UIPopoverElement = HTMLElementForRemoteComponent<
  typeof BasePopover
>;
