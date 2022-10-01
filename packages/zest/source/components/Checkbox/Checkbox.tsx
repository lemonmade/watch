import {type ReactNode, type PropsWithChildren} from 'react';
import {
  resolveSignalOrValue,
  type SignalOrValue,
} from '@watching/react-signals';
import {classes} from '@lemon/css';

import systemStyles from '../../system.module.css';
import {choiceStyles} from '../../utilities/choices';
import {useUniqueId} from '../../utilities/id';

export interface Props {
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
        disabled={resolvedDisabled}
        readOnly={resolvedReadonly}
        className={choiceStyles.Input}
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
