import {
  cloneElement,
  isValidElement,
  type VNode,
  type RenderableProps,
} from 'preact';

import type {
  TextField as TextFieldElement,
  TextFieldProperties,
  TextFieldEvents,
} from '@watching/clips/elements';

export interface TextFieldProps
  extends RenderableProps<
    Omit<Partial<TextFieldProperties>, 'label'>,
    TextFieldElement
  > {
  label?: VNode<any>;
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
  const allProps: TextFieldProps = {
    onchange: onChange ? (event) => onChange(event.detail) : undefined,
    oninput: onInput ? (event) => onInput(event.detail) : undefined,
    ...props,
  };

  let labelChild: VNode<any> | null = null;

  if (label) {
    if (isValidElement(label)) {
      labelChild = cloneElement<any>(label, {slot: 'label'});
    } else {
      allProps.label = label;
    }
  }

  if (labelChild) {
    return <ui-text-field {...allProps}>{labelChild}</ui-text-field>;
  } else {
    return <ui-text-field {...allProps} />;
  }
}
