import {type ReactNode, type PropsWithChildren} from 'react';
import {
  resolveSignalOrValue,
  type SignalOrValue,
} from '@watching/react-signals';
import {classes} from '@lemon/css';

import systemStyles from '../../system.module.css';

import {choiceStyles} from '../../shared/choices.ts';
import {useUniqueId} from '../../shared/id.ts';

export interface CheckboxProps {
  id?: string;
  disabled?: SignalOrValue<boolean>;
  readonly?: SignalOrValue<boolean>;
  checked: SignalOrValue<boolean>;
  helpText?: ReactNode;
  onChange?(checked: boolean): void;
}

export function Checkbox({
  id: explicitId,
  checked,
  disabled,
  readonly,
  children,
  helpText,
  onChange,
}: PropsWithChildren<CheckboxProps>) {
  const id = useUniqueId('Checkbox', explicitId);

  const resolvedChecked = resolveSignalOrValue(checked);
  const resolvedDisabled = resolveSignalOrValue(disabled);
  const resolvedReadonly = resolveSignalOrValue(readonly);
  const disabledAttribute = resolvedDisabled || resolvedReadonly;

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
      className={classes(
        systemStyles.displayInlineGrid,
        choiceStyles.Choice,
        choiceStyles.cornerRadiusBase,
        Boolean(helpText) && choiceStyles.hasHelpText,
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={resolvedChecked}
        disabled={disabledAttribute}
        readOnly={resolvedReadonly}
        className={classes(
          choiceStyles.Input,
          resolvedDisabled && choiceStyles.disabled,
        )}
        onChange={
          handleChange &&
          (({currentTarget: {checked}}) => {
            handleChange(checked);
          })
        }
      ></input>
      <span className={choiceStyles.Label}>{children}</span>
      {helpText && <span className={choiceStyles.HelpText}>{helpText}</span>}
    </label>
  );
}
