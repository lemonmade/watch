import {SPACING_OR_NONE_KEYWORDS type SpacingOrNoneKeyword} from '@watching/design';
import {
  attributeRestrictedToAllowedValues,
  backedByAttributeWithBooleanShorthand,
  ClipsElement,
} from '../ClipsElement.ts';

export interface ModalAttributes {
  /**
   * Whether to add padding on the inside of the modal.
   *
   * @default 'none'
   */
  padding?: SpacingOrNoneKeyword;
}

export interface ModalProperties {
  /**
   * Whether to add padding on the inside of the modal.
   *
   * @default 'none'
   */
  get padding(): SpacingOrNoneKeyword;
  set padding(value: SpacingOrNoneKeyword | boolean | undefined);
}

export interface ModalEvents {}

/**
 * A Modal is an overlay that blocks interaction with the rest of the page. The
 * user must take an action to dismiss the modal, either by pressing on the backdrop,
 * or by pressing an action in the modal that closes it.
 *
 * You should only pass a Modal as the `overlay` prop on action components. Modals
 * passed to this prop will be automatically opened when the action is pressed, and
 * the action will be given accessibility markup that associates it with the modal.
 */
export class Modal extends ClipsElement {
  @backedByAttributeWithBooleanShorthand({
    whenTrue: 'auto',
    ...attributeRestrictedToAllowedValues(SPACING_OR_NONE_KEYWORDS),
  })
  accessor padding: SpacingOrNoneKeyword = 'none';
}

customElements.define('ui-modal', Modal);

declare global {
  interface HTMLElementTagNameMap {
    'ui-modal': InstanceType<typeof Modal>;
  }
}
