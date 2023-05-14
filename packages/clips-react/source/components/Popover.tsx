import {createRemoteComponent} from '@lemonmade/remote-ui-react';
import {Popover as PopoverName, PopoverElement} from '@watching/clips';

export const Popover = createRemoteComponent(PopoverElement, {
  element: PopoverName,
});
