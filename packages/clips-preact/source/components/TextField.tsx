import {
  cloneElement,
  isValidElement,
  type ComponentChild,
  type RenderableProps,
} from 'preact';

import type {
  TextField as TextFieldElement,
  TextFieldProperties,
  TextFieldEvents,
} from '@watching/clips/elements';

export interface TextFieldProps
  extends RenderableProps<
    Omit<Partial<TextFieldProperties>, 'label'> & {
      label?: ComponentChild;
    },
    TextFieldElement
  > {
  onChange?(value: string): void;
  onchange?(event: TextFieldEvents['change']): void;
  onInput?(value: string): void;
  oninput?(event: TextFieldEvents['input']): void;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-text-field': Omit<TextFieldProps, 'onChange' | 'onInput'>;
    }
  }
}

export function TextField({
  label,
  onChange,
  onInput,
  ...props
}: TextFieldProps) {
  const listeners = {
    onchange: onChange ? (event) => onChange(event.detail) : undefined,
    oninput: onInput ? (event) => onInput(event.detail) : undefined,
  } satisfies Pick<TextFieldProps, 'onchange' | 'oninput'>;

  return label && isValidElement(label) ? (
    <ui-text-field {...listeners} {...props}>
      {cloneElement(label, {slot: 'label'})}
    </ui-text-field>
  ) : (
    <ui-text-field label={label} {...listeners} {...props} />
  );
}
