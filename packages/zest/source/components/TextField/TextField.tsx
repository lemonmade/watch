import type {ComponentChild} from 'preact';
import type {SignalOrValue} from '@quilted/quilt/signals';
import type {TextFieldProperties} from '@watching/clips';

import {useUniqueId} from '../../shared/id.ts';

import {Label} from '../Label.tsx';
import {BlockStack} from '../Stack.tsx';

import {Input} from './Input.tsx';

export interface TextFieldProps
  extends Omit<
    Partial<TextFieldProperties>,
    'value' | 'label' | 'maximumLines'
  > {
  value?: SignalOrValue<string | undefined>;
  label?: ComponentChild;
  onChange?(value: string): void;
  onInput?(value: string): void;
  maximumLines?: TextFieldProperties['maximumLines'] | false;
}

export function TextField({
  id: explicitId,
  label,
  labelStyle,
  placeholder,
  ...baseProps
}: TextFieldProps) {
  const id = useUniqueId('TextField', explicitId);

  return (
    <BlockStack spacing="small" inlineAlignment="stretch">
      <Label
        target={id}
        visibility={labelStyle === 'placeholder' ? 'hidden' : 'visible'}
      >
        {label}
      </Label>
      <Input
        id={id}
        {...(baseProps as any)}
        placeholder={
          labelStyle === 'placeholder' && typeof label === 'string'
            ? label
            : placeholder
        }
      />
    </BlockStack>
  );
}
