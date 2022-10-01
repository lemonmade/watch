import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
  type PropsWithChildren,
} from 'react';
import {
  isSignal,
  resolveSignalOrValue,
  type SignalOrValue,
} from '@watching/react-signals';
import {classes, variation} from '@lemon/css';

import systemStyles from '../../system.module.css';
import {useUniqueId} from '../../utilities/id';

import styles from './ChoiceList.module.css';

interface ChoiceListContextValue {
  id: string;
  value?: SignalOrValue<string>;
  onChange?(value: string): void;
}

const ChoiceListContext = createContext<ChoiceListContextValue | null>(null);

export interface Props<Value extends string = string> {
  id?: string;
  value?: SignalOrValue<Value>;
  spacing?: 'small' | 'base';
  onChange?(value: Value): void;
}

export function ChoiceList<Value extends string = string>({
  id: explicitId,
  children,
  value,
  spacing = 'small',
  onChange,
}: PropsWithChildren<Props<Value>>) {
  const id = useUniqueId('ChoiceList', explicitId);

  const contextValue = useMemo<ChoiceListContextValue>(
    () => ({
      id,
      value,
      onChange:
        onChange ??
        (isSignal(value)
          ? (newValue) => {
              value.value = newValue as Value;
            }
          : undefined),
    }),
    [id, value, onChange],
  );

  return (
    <ChoiceListContext.Provider value={contextValue}>
      <div
        className={classes(
          systemStyles.displayGrid,
          systemStyles[variation('spacing', spacing)],
        )}
      >
        {children}
      </div>
    </ChoiceListContext.Provider>
  );
}

export interface ChoiceProps {
  id?: string;
  value: string;
  disabled?: SignalOrValue<boolean>;
  readonly?: SignalOrValue<boolean>;
  helpText?: ReactNode;
}

export function Choice({
  id: explicitId,
  value,
  children,
  disabled,
  readonly,
  helpText,
}: PropsWithChildren<ChoiceProps>) {
  const id = useUniqueId('ChoiceListOption', explicitId);
  const selectorContext = useContext(ChoiceListContext);
  const resolvedDisabled = resolveSignalOrValue(disabled);
  const resolvedReadonly = resolveSignalOrValue(readonly);

  if (selectorContext == null) {
    throw new Error(
      `You need to render <Option> in an <ChoiceList> component.`,
    );
  }

  const handleChange = selectorContext.onChange;

  return (
    <label
      htmlFor={id}
      className={classes(styles.Choice, helpText && styles.hasHelpText)}
    >
      <input
        id={id}
        name={selectorContext.id}
        type="radio"
        value={value}
        checked={value === resolveSignalOrValue(selectorContext.value)}
        onChange={
          handleChange &&
          (({currentTarget: {value}}) => {
            handleChange(value);
          })
        }
        className={styles.Input}
        disabled={resolvedDisabled}
        readOnly={resolvedReadonly}
      ></input>
      <span className={styles.Label}>{children}</span>
      {helpText && <span className={styles.HelpText}>{helpText}</span>}
    </label>
  );
}
