import {useUniqueId} from '../../utilities/id';
import {type PropsForClipsComponent} from '../../utilities/clips';

import {Label} from '../Label';
import {BlockStack} from '../BlockStack';

import {Input} from './Input';

type Props = PropsForClipsComponent<'TextField'>;

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
