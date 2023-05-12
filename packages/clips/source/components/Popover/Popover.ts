import {createRemoteElement} from '@lemonmade/remote-ui/elements';

export type PopoverBlockAttachment = 'start' | 'end';
export type PopoverInlineAttachment = 'start' | 'center' | 'end';

export interface PopoverProperties {
  blockAttachment?: PopoverBlockAttachment;
  inlineAttachment?: PopoverInlineAttachment;
}

export const Popover = 'ui-popover';

export const PopoverElement = createRemoteElement<PopoverProperties>({
  properties: {
    blockAttachment: {type: String},
    inlineAttachment: {type: String},
  },
});

customElements.define(Popover, PopoverElement);

declare global {
  interface HTMLElementTagNameMap {
    [Popover]: InstanceType<typeof PopoverElement>;
  }
}
