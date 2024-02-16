import {createRemoteElement} from '@remote-dom/core/elements';

export type PopoverBlockAttachment = 'start' | 'end';
export type PopoverInlineAttachment = 'start' | 'center' | 'end';

export interface PopoverProperties {
  blockAttachment?: PopoverBlockAttachment;
  inlineAttachment?: PopoverInlineAttachment;
}

export const Popover = createRemoteElement<PopoverProperties>({
  properties: {
    blockAttachment: {type: String},
    inlineAttachment: {type: String},
  },
});

customElements.define('ui-popover', Popover);

declare global {
  interface HTMLElementTagNameMap {
    'ui-popover': InstanceType<typeof Popover>;
  }
}
