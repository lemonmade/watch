import {useState, useRef, type ChangeEvent, type KeyboardEvent} from 'react';
import {type Signal} from '@preact/signals-core';
import {classes, variation} from '@lemon/css';

import {useUniqueId} from '../../utilities/id';
import {useContainingForm} from '../../utilities/forms';
import {useMenuController} from '../../utilities/menus';

import styles from './Input.module.css';

export type ChangeTiming = 'commit' | 'input';

export type TextFieldProps = {
  id?: string;
  multiline?: boolean | number;
  blockSize?: 'fitContent';
  placeholder?: string;
} & (
  | {
      disabled?: false;
      readonly?: false;
      value?: string;
      changeTiming?: ChangeTiming;
      onChange(value: string): void;
      onInput?(value: string): void;
    }
  | {
      disabled?: false;
      readonly?: false;
      value: Signal<string>;
      changeTiming?: ChangeTiming;
      onChange?(value: string): void;
      onInput?(value: string): void;
    }
  | {
      value?: string | Signal<string | undefined>;
      disabled: true;
      readonly?: false;
      changeTiming?: never;
      onChange?: never;
      onInput?: never;
    }
  | {
      value?: string | Signal<string | undefined>;
      disabled?: false;
      readonly: true;
      changeTiming?: never;
      onChange?: never;
      onInput?: never;
    }
);

export function TextField({
  id: explicitId,
  value: currentValue,
  disabled,
  readonly,
  multiline = false,
  blockSize = multiline === true ? 'fitContent' : undefined,
  placeholder,
  changeTiming = 'commit',
  onInput,
  onChange,
}: TextFieldProps) {
  const id = useUniqueId('Input', explicitId);
  const [value, setValue] = usePartiallyControlledState(currentValue);
  const containingForm = useContainingForm();
  const menu = useMenuController({required: false});

  const inlineStyles: Record<string, any> = {};

  if (typeof multiline === 'number') {
    inlineStyles['--x-TextField-lines'] = multiline;
  }

  const InputElement = multiline ? 'textarea' : 'input';

  const handleChange =
    onChange ??
    (disabled ||
    readonly ||
    currentValue == null ||
    typeof currentValue === 'string'
      ? undefined
      : (newValue: string) => {
          currentValue.value = newValue;
        });

  return (
    <div
      className={classes(
        styles.TextField,
        multiline && styles.multiline,
        blockSize && styles[variation('blockSize', blockSize)],
      )}
      style={inlineStyles}
    >
      <InputElement
        id={id}
        type={multiline ? undefined : 'text'}
        className={styles.Input}
        value={value}
        onChange={({
          currentTarget,
        }: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const newValue = currentTarget.value;
          setValue(newValue);
          onInput?.(newValue);
          if (changeTiming === 'input') handleChange?.(newValue);
        }}
        onKeyDown={menu?.keypress}
        onKeyPress={
          multiline || changeTiming !== 'commit'
            ? undefined
            : (
                event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
              ) => {
                const {key, currentTarget} = event;
                const newValue = currentTarget.value;

                if (key.toLowerCase() === 'enter') {
                  onInput?.(newValue);
                  handleChange?.(newValue);
                }
              }
        }
        onBlur={
          changeTiming === 'commit'
            ? () => handleChange?.(value ?? '')
            : undefined
        }
        form={containingForm?.nested ? containingForm.id : undefined}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readonly}
      />
      {blockSize === 'fitContent' && (
        <div className={styles.AutoGrowWrap}>{value} </div>
      )}
    </div>
  );
}

function usePartiallyControlledState(
  value: string | Signal<string | undefined> = '',
) {
  const resolvedValue = typeof value === 'string' ? value : value.value ?? '';
  const [localValue, setLocalValue] = useState(resolvedValue);
  const lastExplicitValue = useRef(resolvedValue);

  let valueToReturn = localValue;

  if (lastExplicitValue.current !== resolvedValue) {
    lastExplicitValue.current = resolvedValue;
    setLocalValue(resolvedValue);
    valueToReturn = resolvedValue;
  }

  return [valueToReturn, setLocalValue] as const;
}
