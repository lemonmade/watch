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
  extends Omit<Partial<TextFieldProperties>, 'label'> {
  label?: ComponentChild;
  onChange?(value: string): void;
  onInput?(value: string): void;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-text-field': RenderableProps<
        Omit<TextFieldProps, 'onChange' | 'onInput'> & {
          onchange?: (event: TextFieldEvents['change']) => void;
          oninput?: (event: TextFieldEvents['input']) => void;
        },
        TextFieldElement
      >;
    }
  }
}

export function TextField({
  label,
  onChange,
  onInput,
  ...props
}: RenderableProps<TextFieldProps, TextFieldElement>) {
  const listeners = {
    onchange: onChange ? (event) => onChange(event.detail) : undefined,
    oninput: onInput ? (event) => onInput(event.detail) : undefined,
  } satisfies Partial<import('preact').JSX.IntrinsicElements['ui-text-field']>;

  return label && isValidElement(label) ? (
    <ui-text-field {...props} {...listeners}>
      {cloneElement(label, {slot: 'label'})}
    </ui-text-field>
  ) : (
    <ui-text-field label={label} {...props} {...listeners} />
  );
}
