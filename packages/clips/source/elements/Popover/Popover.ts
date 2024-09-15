import {
  POPOVER_ATTACHMENT_KEYWORDS,
  type PopoverAttachmentKeyword,
} from '@watching/design';

import {
  ClipsElement,
  backedByAttribute,
  attributeRestrictedToAllowedValues,
} from '../ClipsElement.ts';

export interface PopoverAttributes {
  /**
   * The block attachment point for the popover.
   */
  'block-attachment'?: PopoverAttachmentKeyword;

  /**
   * The inline attachment point for the popover.
   */
  'inline-attachment'?: PopoverAttachmentKeyword;
}

export interface PopoverProperties {
  /**
   * The block attachment point for the popover.
   * @default 'auto'
   */
  blockAttachment: PopoverAttachmentKeyword;

  /**
   * The inline attachment point for the popover.
   * @default 'auto'
   */
  inlineAttachment: PopoverAttachmentKeyword;
}

export interface PopoverEvents {}

/**
 * Popovers are used to display content that is contextually related to another element on the page.
 */
export class Popover
  extends ClipsElement<PopoverAttributes, PopoverEvents>
  implements PopoverProperties
{
  static get remoteAttributes() {
    return [
      'block-attachment',
      'inline-attachment',
    ] satisfies (keyof PopoverAttributes)[];
  }

  @backedByAttribute({
    name: 'block-attachment',
    ...attributeRestrictedToAllowedValues(POPOVER_ATTACHMENT_KEYWORDS),
  })
  accessor blockAttachment: PopoverAttachmentKeyword = 'auto';

  @backedByAttribute({
    name: 'inline-attachment',
    ...attributeRestrictedToAllowedValues(POPOVER_ATTACHMENT_KEYWORDS),
  })
  accessor inlineAttachment: PopoverAttachmentKeyword = 'auto';
}

customElements.define('ui-popover', Popover);

declare global {
  interface HTMLElementTagNameMap {
    'ui-popover': InstanceType<typeof Popover>;
  }
}
