import {Popover as BasePopover} from '@watching/clips';
import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared';

export const Popover = 'ui-popover';

export const PopoverComponent = createRemoteDOMComponent(BasePopover, {
  properties: ['blockAttachment', 'inlineAttachment'],
});

export type UIPopoverElement = HTMLElementForRemoteComponent<
  typeof BasePopover
>;
