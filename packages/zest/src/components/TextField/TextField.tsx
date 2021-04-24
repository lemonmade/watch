import type {ComponentProps} from 'react';
import {
  TextField as TextFieldInput,
  Label,
  BlockStack,
  useUniqueId,
} from '@lemon/basics';

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
