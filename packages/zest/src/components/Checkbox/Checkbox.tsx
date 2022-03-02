import type {PropsWithChildren} from 'react';
import {useUniqueId} from '@lemon/basics';

export interface Props {
  id?: string;
  checked?: boolean;
  onChange(checked: boolean): void;
}

export function Checkbox({
  id: explicitId,
  checked,
  children,
  onChange,
}: PropsWithChildren<Props>) {
  const id = useUniqueId('Checkbox', explicitId);

  return (
    <div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={({currentTarget: {checked}}) => {
          onChange(checked);
        }}
      ></input>
      <label htmlFor={id}>{children}</label>
    </div>
  );
}
