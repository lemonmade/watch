import {
  forwardRef,
  cloneElement,
  isValidElement,
  type ReactNode,
  type PropsWithChildren,
  type ForwardedRef,
} from 'react';

import type {
  TextField as TextFieldElement,
  TextFieldProperties,
  TextFieldEvents,
} from '@watching/clips/elements';

export interface TextFieldProps
  extends PropsWithChildren<
    Omit<Partial<TextFieldProperties>, 'label'> & {
      label?: ReactNode;
    }
  > {
  ref?: ForwardedRef<TextFieldElement>;
  onChange?(value: string): void;
  onchange?(event: TextFieldEvents['change']): void;
  onInput?(value: string): void;
  oninput?(event: TextFieldEvents['input']): void;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-text-field': Omit<TextFieldProps, 'onChange' | 'onInput'>;
    }
  }
}

export const TextField = forwardRef<TextFieldElement, TextFieldProps>(
  function TextField({label, onChange, onInput, ...props}) {
    const listeners = {
      onchange: onChange ? (event) => onChange(event.detail) : undefined,
      oninput: onInput ? (event) => onInput(event.detail) : undefined,
    } satisfies Pick<TextFieldProps, 'onchange' | 'oninput'>;

    return label && isValidElement(label) ? (
      <ui-text-field {...listeners} {...props}>
        {cloneElement<any>(label, {slot: 'label'})}
      </ui-text-field>
    ) : (
      <ui-text-field label={label} {...listeners} {...props} />
    );
  },
);
