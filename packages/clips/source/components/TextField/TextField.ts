import {createRemoteComponent, type RemoteFragment} from '@remote-ui/core';

import {type SignalOrValue} from '../../signals.ts';

export type TextFieldType = 'text' | 'email';
export type TextFieldLabelStyle = 'default' | 'placeholder';
export type TextFieldChangeTiming = 'commit' | 'input';
export type TextFieldAutocompleteTarget = 'username' | 'email' | 'webauthn';

export interface TextFieldProps {
  /**
   * A unique identifier for the text field. If you do not provide one,
   * one will be generated for you.
   */
  id?: string;

  /**
   * The type of data that the textfield is meant to collect. This may affect
   * the keyboard that is shown on virtual keyboards.
   *
   * @default 'text'
   */
  type?: TextFieldType;

  /**
   * The minimum number of lines of text that will be shown in the text field.
   *
   * @default 1
   */
  minimumLines?: number;

  /**
   * The maximum number of lines of text that will be shown in the text field.
   * When this value is greater than `minimumLines`, the text field will grow
   * to match the number of lines of text entered by the user for lines between
   * the minimum and maximum limits. When set to `false` or `Infinity`, the
   *  text field will grow to fit as much text as the user enters.
   *
   * @default 1
   */
  maximumLines?: number | false;

  /**
   * Whether this text field is resizable. If `true`, resize controls will be
   * shown on the field, and the user can resize the field between the minimum
   * and maximum number of lines allowed for this field.
   */
  resize?: boolean;

  /**
   * The label to use for this text field. You **must** provide a label so that
   * users get an accessible description of what content to enter in the field.
   */
  label: string | RemoteFragment<any>;

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
  labelStyle?: TextFieldLabelStyle;

  /**
   * A hint for the content that the user should enter in the text field. This
   * prop should always be used **in addition to** the `label` prop, and should
   * not duplicate the content used for the label.
   */
  placeholder?: string;

  /**
   * The current `value` of the text field. This can be either a `string`, `undefined`,
   * or a `Signal` containing one of these values. If you provide a signal, the text
   * field will automatically the value of the signal on change — no `onChange` required!
   */
  value?: SignalOrValue<string | undefined>;

  /**
   * Whether the text field is disabled. When `disabled`, the user will not be able to
   * edit the text field’s content, and can’t focus the input.
   *
   * @default false
   */
  disabled?: SignalOrValue<boolean>;

  /**
   * Whether the text field is in a readonly mode. When `readonly`, the user will not
   * be able to edit the text field’s content, but they can focus the input.
   *
   * @default false
   */
  readonly?: SignalOrValue<boolean>;

  /**
   * A hint to browsers about the content of the field, so that they can provide
   * appropriate autocomplete suggestions.
   */
  autocomplete?:
    | TextFieldAutocompleteTarget
    | `${TextFieldAutocompleteTarget} ${TextFieldAutocompleteTarget}`;

  /**
   * By default, the text field will call `onChange` only when a change is “committed” by
   * the user; that is, they either blur the field, or press the `enter` key (and the field
   * is not multiline). In between commits, your component will not know the current value,
   * but the text field will continue to show the in-progress state to the user. If you need
   * to get the updated value as the user types, you can set this prop to `'input'`, which will
   * cause `onChange` to be called on every keystroke. Additionally, if you pass a `Signal` as
   * the value of the text field, the value of the signal will update as the user types.
   *
   * @default 'commit'
   */
  changeTiming?: TextFieldChangeTiming;

  /**
   * A callback that is run when the user changes the text field value. By default, `onChange`
   * is only called when the user commits a change to the text field by blurring the field, or
   * pressing `enter` in a single-line field. If you need this value to be called on every keystroke,
   * you can set the `changeTiming` prop to `'input'`.
   *
   * If you provide this callback, and `value` is a `Signal`, the signal value will not be updated
   * automatically for you. You can update the signal’s value, if appropriate.
   */
  onChange?(value: string): void;

  /**
   * A callback that is run every time the user types a character in the text field.
   * If `changeTiming` is set to `'input'`, both `onChange` and `onInput` are run for every
   * change. In this case, `onInput` is called first.
   */
  onInput?(value: string): void;
}

/**
 * TextField is used to collect text input from a user.
 */
export const TextField = createRemoteComponent<'TextField', TextFieldProps>(
  'TextField',
);
