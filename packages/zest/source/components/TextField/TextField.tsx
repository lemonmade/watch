import type {ComponentProps} from 'react';
import {useUniqueId} from '../../utilities/id';

import {Label} from '../Label';
import {BlockStack} from '../BlockStack';

import {TextField as TextFieldInput} from './Input';

interface Props extends ComponentProps<typeof TextFieldInput> {
  label?: string;
}

export function TextField({id: explicitId, label, ...baseProps}: Props) {
  const id = useUniqueId('ZTextField', explicitId);

  return (
    <BlockStack spacing="small">
      <Label target={id}>{label}</Label>
      <TextFieldInput id={id} {...baseProps} />
    </BlockStack>
  );
}
