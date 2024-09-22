import type {
  RemoteEvent,
  RemoteElementEventListenersDefinition,
} from '@remote-dom/core/elements';
import {
  TEXT_FIELD_KEYBOARD_TYPE_KEYWORDS,
  type TextFieldKeyboardTypeKeyword,
  TEXT_FIELD_RESIZE_KEYWORDS,
  type TextFieldResizeKeyword,
  TEXT_FIELD_LABEL_STYLE_KEYWORDS,
  type TextFieldLabelStyleKeyword,
  type TextFieldAutocompleteValue,
} from '@watching/design';

import {
  ClipsElement,
  backedByAttribute,
  backedByAttributeAsBoolean,
  formatAttributeValue,
  attributeRestrictedToAllowedValues,
  type AttributeValueAsPropertySetter,
} from '../ClipsElement.ts';
// import {type SignalOrValue} from '../../signals.ts';

export interface TextFieldAttributes {
  /**
   * A unique identifier for the text field.
   */
  id?: string;

  /**
   * A hint for the keyboard to use when entering text on a device with
   * a virtual keyboard.
   */
  'keyboard-type'?: TextFieldKeyboardTypeKeyword;

  /**
   * The minimum number of lines of text that will be shown in the text field.
   */
  'minimum-lines'?: string;

  /**
   * The maximum number of lines of text that will be shown in the text field.
   */
  'maximum-lines'?: string;

  /**
   * Whether this text field is resizable. If `true`, resize controls will be
   * shown on the field, and the user can resize the field between the minimum
   * and maximum number of lines allowed for this field.
   */
  resize?: TextFieldResizeKeyword;

  /**
   * The label to use for this text field. You **must** provide a label so that
   * users get an accessible description of what content to enter in the field.
   */
  label?: string;

  /**
   * The visual style of the label. By default, the label is rendered above the
   * input, so that it remains visible even when the user has entered content. In
   * extremely rare cases, you may wish to make the label appear as a placeholder
   * instead. This is typically done for text fields where the content the user can
   * enter is highly variable, and where the user is expected to know exactly what
   * they are doing based on the context of how they got to the text field. In these
   * rare cases, you can use the `'placeholder'` style to make the label appear as
   * the placeholder. In this case, the `label` prop must be a `string`, and the
   * `placeholder` prop will be ignored.
   */
  'label-style'?: TextFieldLabelStyleKeyword;

  /**
   * A hint for the content that the user should enter in the text field. This
   * prop should always be used **in addition to** the `label` prop, and should
   * not duplicate the content used for the label.
   */
  placeholder?: string;

  /**
   * The default `value` for the text field.
   */
  value?: string;

  /**
   * Whether the text field is disabled. When `disabled`, the user will not be able to
   * edit the text field’s content, and can’t focus the input.
   */
  disabled?: '';

  /**
   * Whether the text field is in a readonly mode. When `readonly`, the user will not
   * be able to edit the text field’s content, but they can focus the input.
   */
  readonly?: '';

  /**
   * A hint to browsers about the content of the field, so that they can provide
   * appropriate autocomplete suggestions.
   */
  autocomplete?: TextFieldAutocompleteValue;
}

export interface TextFieldProperties {
  /**
   * A unique identifier for the text field.
   */
  id?: string;

  /**
   * A hint for the keyboard to use when entering text on a device with
   * a virtual keyboard.
   *
   * @default 'text'
   */
  keyboardType: TextFieldKeyboardTypeKeyword;

  /**
   * The minimum number of lines of text that will be shown in the text field.
   *
   * @default 1
   */
  minimumLines: number;

  /**
   * The maximum number of lines of text that will be shown in the text field.
   *
   * @default 1
   */
  maximumLines: number;

  /**
   * Whether this text field is resizable. If `true`, resize controls will be
   * shown on the field, and the user can resize the field between the minimum
   * and maximum number of lines allowed for this field.
   *
   * @default 'none'
   */
  resize: TextFieldResizeKeyword;

  /**
   * The label to use for this text field. You **must** provide a label so that
   * users get an accessible description of what content to enter in the field.
   */
  label?: string;

  /**
   * The visual style of the label. By default, the label is rendered above the
   * input, so that it remains visible even when the user has entered content. In
   * extremely rare cases, you may wish to make the label appear as a placeholder
   * instead. This is typically done for text fields where the content the user can
   * enter is highly variable, and where the user is expected to know exactly what
   * they are doing based on the context of how they got to the text field. In these
   * rare cases, you can use the `'placeholder'` style to make the label appear as
   * the placeholder. In this case, the `label` prop must be a `string`, and the
   * `placeholder` prop will be ignored.
   *
   * @default 'default'
   */
  labelStyle: TextFieldLabelStyleKeyword;

  /**
   * A hint for the content that the user should enter in the text field. This
   * prop should always be used **in addition to** the `label` prop, and should
   * not duplicate the content used for the label.
   */
  placeholder?: string;

  /**
   * The default `value` for the text field.
   */
  value: string;

  /**
   * Whether the text field is disabled. When `disabled`, the user will not be able to
   * edit the text field’s content, and can’t focus the input.
   */
  disabled: boolean;

  /**
   * Whether the text field is in a readonly mode. When `readonly`, the user will not
   * be able to edit the text field’s content, but they can focus the input.
   */
  readonly: boolean;

  /**
   * A hint to browsers about the content of the field, so that they can provide
   * appropriate autocomplete suggestions.
   */
  autocomplete?: TextFieldAutocompleteValue;
}

export interface TextFieldEvents {
  /**
   * An that is run when the user changes the text field value.
   *
   * If you provide this callback, and `value` is set to a `Signal`, the signal value will not be updated
   * automatically for you. You can update the signal’s value in this event, if appropriate.
   */
  change: RemoteEvent<string>;

  /**
   * An event that is run every time the user types a character in the text field.
   * This event is triggered before the `change` event.
   */
  input: RemoteEvent<string>;
}

const DEFAULT_RESIZE_VALUE = 'none';

/**
 * TextField is used to collect text input from a user.
 */
export class TextField
  extends ClipsElement<TextFieldAttributes, TextFieldEvents>
  implements TextFieldProperties
{
  static get remoteEvents(): RemoteElementEventListenersDefinition<TextFieldEvents> {
    return {
      change: {
        bubbles: true,
      },
      input: {
        bubbles: true,
        dispatchEvent(this: TextField, arg) {
          this.value = arg;
        },
      },
    };
  }

  static get remoteAttributes() {
    return [
      'id',
      'keyboard-type',
      'minimum-lines',
      'maximum-lines',
      'resize',
      'label',
      'label-style',
      'placeholder',
      'value',
      'disabled',
      'readonly',
      'autocomplete',
    ] satisfies (keyof TextFieldAttributes)[];
  }

  #value = '';

  get value() {
    return this.#value;
  }

  set value(value: string) {
    this.#value = String(value);
  }

  @backedByAttribute()
  accessor label: string | undefined;

  @backedByAttribute({
    name: 'label-style',
    ...attributeRestrictedToAllowedValues(TEXT_FIELD_LABEL_STYLE_KEYWORDS),
  })
  accessor labelStyle: TextFieldLabelStyleKeyword = 'default';

  @backedByAttributeAsBoolean()
  accessor disabled: boolean = false;

  @backedByAttributeAsBoolean()
  accessor readonly: boolean = false;

  @backedByAttribute({
    name: 'keyboard-type',
    ...attributeRestrictedToAllowedValues(TEXT_FIELD_KEYBOARD_TYPE_KEYWORDS),
  })
  accessor keyboardType: TextFieldKeyboardTypeKeyword = 'text';

  @backedByAttribute()
  accessor placeholder: string | undefined;

  @backedByAttribute()
  accessor autocomplete: TextFieldAutocompleteValue | undefined;

  @backedByAttribute({
    name: 'minimum-lines',
    parse(value) {
      return value ? Number(value) : undefined;
    },
    serialize(value, {current}) {
      if (typeof value !== 'number' || value < 1) return current.toString();
      return Math.round(value).toString();
    },
  })
  accessor minimumLines: number = 1;

  @backedByAttribute({
    name: 'maximum-lines',
    parse(value) {
      return value ? Number(value) : undefined;
    },
    serialize(value, {current}) {
      if (typeof value !== 'number' || value < 1) return current.toString();
      return Math.round(value).toString();
    },
  })
  accessor maximumLines: number = 1;

  get resize(): TextFieldResizeKeyword {
    return (
      formatAttributeValue(this.getAttribute('resize'), {
        allowed: TEXT_FIELD_RESIZE_KEYWORDS,
      }) ?? DEFAULT_RESIZE_VALUE
    );
  }

  set resize(value: AttributeValueAsPropertySetter<TextFieldResizeKeyword>) {
    const resolvedValue =
      formatAttributeValue(value, {
        allowed: TEXT_FIELD_RESIZE_KEYWORDS,
        false: 'none',
        truthy: 'block',
      }) ?? DEFAULT_RESIZE_VALUE;

    if (resolvedValue === 'none') {
      this.removeAttribute('resize');
    } else {
      this.setAttribute('resize', resolvedValue);
    }
  }
}

customElements.define('ui-text-field', TextField);

declare global {
  interface HTMLElementTagNameMap {
    'ui-text-field': InstanceType<typeof TextField>;
  }
}
