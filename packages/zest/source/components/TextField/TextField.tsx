import {useUniqueId} from '../../shared/id.ts';
import {type PreactComponentPropsForClipsElement} from '../../shared/clips.ts';

import {Label} from '../Label.tsx';
import {BlockStack} from '../Stack.tsx';

import {Input} from './Input.tsx';

export type TextFieldProps =
  PreactComponentPropsForClipsElement<'ui-text-field'>;

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
