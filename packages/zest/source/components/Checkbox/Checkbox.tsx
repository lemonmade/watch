import {type PropsWithChildren} from 'react';
import {
  resolveSignalOrValue,
  type SignalOrValue,
} from '@watching/react-signals';
import {classes} from '@lemon/css';

import systemStyles from '../../system.module.css';
import {useUniqueId} from '../../utilities/id';

import styles from './Checkbox.module.css';

export interface Props {
  id?: string;
  disabled?: SignalOrValue<boolean>;
  readonly?: SignalOrValue<boolean>;
  checked: SignalOrValue<boolean>;
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

  const resolvedChecked = resolveSignalOrValue(checked);
  const resolvedDisabled = resolveSignalOrValue(disabled);
  const resolvedReadonly = resolveSignalOrValue(readonly);

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
