import {useState, useRef} from 'react';
import type {PropsWithChildren, ChangeEvent, KeyboardEvent} from 'react';
import {classes, variation} from '@lemon/css';

import {useUniqueId} from '../../utilities/id';
import {useContainingForm} from '../../utilities/forms';

import styles from './TextField.css';

interface Props {
  id?: string;
  label?: string;
  value?: string;
  multiline?: boolean | number;
  blockSize?: 'fitContent';
  onInput?(value: string): void;
  onChange?(value: string): void;
}

export function TextField({
  id: explicitId,
  label,
  value: currentValue,
  multiline = false,
  blockSize = multiline === true ? 'fitContent' : undefined,
  onInput,
  onChange,
}: PropsWithChildren<Props>) {
  const id = useUniqueId('TextField', explicitId);
  const [value, setValue] = usePartiallyControlledState(currentValue);
  const containingForm = useContainingForm();

  const InputElement = multiline ? 'textarea' : 'input';

  const style =
    typeof multiline === 'number'
      ? {'--z-TextField-lines': multiline}
      : undefined;

  return (
    <div
      className={classes(
        styles.TextField,
        multiline && styles.multiline,
        blockSize && styles[variation('blockSize', blockSize)],
      )}
      style={style as any}
    >
      {label && <label htmlFor={id}>{label}</label>}
      <div className={styles.InputContainer}>
        <InputElement
          id={id}
          type={multiline ? undefined : 'text'}
          className={styles.Input}
          value={value}
          onChange={({
            currentTarget,
          }: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setValue(currentTarget.value);
            onInput?.(currentTarget.value);
          }}
          onKeyPress={({
            key,
            currentTarget,
          }: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            if (key.toLowerCase() === 'enter') {
              setValue(currentTarget.value);
              onInput?.(currentTarget.value);
              onChange?.(currentTarget.value);
            }
          }}
          onBlur={() => onChange?.(value ?? '')}
          form={containingForm?.nested ? containingForm.id : undefined}
        />
        {blockSize === 'fitContent' && (
          <div className={styles.AutoGrowWrap}>{value} </div>
        )}
      </div>
    </div>
  );
}

function usePartiallyControlledState(value = '') {
  const [localValue, setLocalValue] = useState(value);
  const lastExplicitValue = useRef(value);

  let valueToReturn = localValue;

  if (lastExplicitValue.current !== value) {
    lastExplicitValue.current = value;
    setLocalValue(value);
    valueToReturn = value;
  }

  return [valueToReturn, setLocalValue] as const;
}
