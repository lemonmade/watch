import {type PropsWithChildren} from 'react';
import {type Signal} from '@watching/react-signals';
import {classes} from '@lemon/css';

import systemStyles from '../../system.module.css';
import {useUniqueId} from '../../utilities/id';

import styles from './Checkbox.module.css';

export interface Props {
  id?: string;
  disabled?: boolean | Signal<boolean>;
  readonly?: boolean | Signal<boolean>;
  checked: boolean | Signal<boolean>;
  onChange?(checked: boolean): void;
}

export function Checkbox({
  id: explicitId,
  checked,
  disabled,
  readonly,
  children,
  onChange,
}: PropsWithChildren<Props>) {
  const id = useUniqueId('Checkbox', explicitId);

  const resolvedChecked = resolveMaybeSignal(checked);
  const resolvedDisabled = resolveMaybeSignal(disabled);
  const resolvedReadonly = resolveMaybeSignal(readonly);

  const handleChange =
    onChange ??
    (resolvedDisabled || resolvedReadonly || typeof checked === 'boolean'
      ? undefined
      : (newChecked) => {
          checked.value = newChecked;
        });

  return (
    <label
      htmlFor={id}
      className={classes(systemStyles.displayInlineGrid, styles.Checkbox)}
    >
      <input
        id={id}
        type="checkbox"
        checked={resolvedChecked}
        disabled={resolvedDisabled}
        readOnly={resolvedReadonly}
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

function resolveMaybeSignal<T>(value: T | Signal<T>): T {
  return typeof value === 'object' && value != null && 'value' in value
    ? value.value
    : value;
}
