import type {ComponentProps, ReactNode} from 'react';
import {useUniqueId} from '../../utilities/id';

import {Label} from '../Label';
import {BlockStack} from '../BlockStack';

import {TextField as TextFieldInput} from './Input';

type Props = Omit<ComponentProps<typeof TextFieldInput>, 'placeholder'> &
  (
    | {label: string; labelStyle: 'placeholder'; placeholder?: never}
    | {label: ReactNode; labelStyle?: 'default'; placeholder?: string}
  );

export function TextField({
  id: explicitId,
  label,
  labelStyle,
  placeholder,
  ...baseProps
}: Props) {
  const id = useUniqueId('TextField', explicitId);

  return (
    <BlockStack spacing="small" align="stretch">
      <Label
        target={id}
        visibility={labelStyle === 'placeholder' ? 'hidden' : 'visible'}
      >
        {label}
      </Label>
      <TextFieldInput
        id={id}
        {...baseProps}
        placeholder={
          labelStyle === 'placeholder' && typeof label === 'string'
            ? label
            : placeholder
        }
      />
    </BlockStack>
  );
}
