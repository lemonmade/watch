import type {ComponentChild, RenderableProps} from 'preact';
import {useMemo} from 'preact/hooks';
import {
  isSignal,
  resolveSignalOrValue,
  type SignalOrValue,
} from '@quilted/quilt/signals';
import {createOptionalContext} from '@quilted/quilt/context';
import {classes} from '@lemon/css';

import systemStyles from '../../system.module.css';

import {choiceStyles} from '../../shared/choices.ts';
import {useUniqueId} from '../../shared/id.ts';

interface ChoiceListContextValue {
  id: string;
  value?: SignalOrValue<string>;
  onChange?(value: string): void;
}

const ChoiceListContext = createOptionalContext<ChoiceListContextValue>();
const useChoiceListContext = ChoiceListContext.use;

export interface ChoiceListProps<Value extends string = string> {
  id?: string;
  value?: SignalOrValue<Value>;
  spacing?: boolean | 'base';
  onChange?(value: Value): void;
}

export function ChoiceList<Value extends string = string>({
  id: explicitId,
  children,
  value,
  spacing = true,
  onChange,
}: RenderableProps<ChoiceListProps<Value>>) {
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
          spacing && systemStyles.spacingSmall1,
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
  helpText?: ComponentChild;
}

export function Choice({
  id: explicitId,
  value,
  children,
  disabled,
  readonly,
  helpText,
}: RenderableProps<ChoiceProps>) {
  const id = useUniqueId('ChoiceListOption', explicitId);
  const choiceListContext = useChoiceListContext();
  const resolvedDisabled = resolveSignalOrValue(disabled);
  const resolvedReadonly = resolveSignalOrValue(readonly);
  const disabledAttribute = resolvedDisabled || resolvedReadonly;

  const handleChange = choiceListContext.onChange;

  return (
    <label
      htmlFor={id}
      className={classes(
        choiceStyles.Choice,
        choiceStyles.cornerRadiusFullyRounded,
        Boolean(helpText) && choiceStyles.hasHelpText,
      )}
    >
      <input
        id={id}
        name={choiceListContext.id}
        type="radio"
        value={value}
        checked={value === resolveSignalOrValue(choiceListContext.value)}
        onChange={
          handleChange &&
          (({currentTarget: {value}}) => {
            handleChange(value);
          })
        }
        className={classes(
          choiceStyles.Input,
          resolvedDisabled && choiceStyles.disabled,
        )}
        disabled={disabledAttribute}
        readOnly={resolvedReadonly}
      ></input>
      <span className={choiceStyles.Label}>{children}</span>
      {helpText && <span className={choiceStyles.HelpText}>{helpText}</span>}
    </label>
  );
}
