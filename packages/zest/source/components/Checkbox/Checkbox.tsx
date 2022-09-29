import {type PropsWithChildren} from 'react';
import {type Signal} from '@watching/react-signals';
import {classes} from '@lemon/css';

import systemStyles from '../../system.module.css';
import {useUniqueId} from '../../utilities/id';

import styles from './Checkbox.module.css';

export type Props = {
  id?: string;
} & (
  | {
      disabled?: false;
      readonly?: false;
      checked: boolean;
      onChange(checked: boolean): void;
    }
  | {
      disabled?: false;
      readonly?: false;
      checked: Signal<boolean>;
      onChange?(checked: boolean): void;
    }
  | {
      checked: boolean | Signal<boolean>;
      disabled: true;
      readonly?: false;
      onChange?: never;
    }
  | {
      checked: boolean | Signal<boolean>;
      disabled?: false;
      readonly: true;
      onChange?: never;
    }
);

export function Checkbox({
  id: explicitId,
  checked,
  disabled,
  readonly,
  children,
  onChange,
}: PropsWithChildren<Props>) {
  const id = useUniqueId('Checkbox', explicitId);

  const handleChange =
    onChange ??
    (disabled || readonly || typeof checked === 'boolean'
      ? undefined
      : (newChecked) => {
          checked.value = newChecked;
        });

  const resolvedChecked =
    typeof checked === 'boolean' ? checked : checked.value;

  return (
    <label
      htmlFor={id}
      className={classes(systemStyles.displayInlineGrid, styles.Checkbox)}
    >
      <input
        id={id}
        type="checkbox"
        checked={resolvedChecked}
        disabled={disabled}
        readOnly={readonly}
        className={styles.Input}
        onChange={
          handleChange &&
          (({currentTarget: {checked}}) => {
            handleChange(checked);
          })
        }
      ></input>
      <span className={styles.Label}>{children}</span>
    </label>
  );
}
