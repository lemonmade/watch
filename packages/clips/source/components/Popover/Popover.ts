import {createRemoteComponent} from '@remote-ui/core';

export type PopoverBlockAttachment = 'start' | 'end';
export type PopoverInlineAttachment = 'start' | 'center' | 'end';

export interface PopoverProps {
  blockAttachment?: PopoverBlockAttachment;
  inlineAttachment?: PopoverInlineAttachment;
}

export const Popover = createRemoteComponent<'Popover', PopoverProps>(
  'Popover',
);
