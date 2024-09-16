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

import {useCustomElementProperties} from './shared.ts';

export interface TextFieldProps
  extends PropsWithChildren<Omit<Partial<TextFieldProperties>, 'label'>> {
  ref?: ForwardedRef<TextFieldElement>;
  label?: ReactNode;
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
  function TextField({label, onChange, onInput, ...props}, ref) {
    const allProps: TextFieldProps = {
      onchange: onChange ? (event) => onChange(event.detail) : undefined,
      oninput: onInput ? (event) => onInput(event.detail) : undefined,
      ...props,
    };

    let labelChild: ReactNode = null;

    if (label) {
      if (isValidElement(label)) {
        labelChild = cloneElement<any>(label, {slot: 'label'});
      } else {
        allProps.label = label;
      }
    }

    useCustomElementProperties(allProps, ref);

    return (
      <ui-text-field {...allProps} ref={ref}>
        {labelChild}
      </ui-text-field>
    );
  },
);
