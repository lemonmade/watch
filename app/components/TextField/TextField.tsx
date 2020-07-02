import React, {useState, useRef, useCallback} from 'react';
import {classes} from '@lemon/css';
import styles from './TextField.css';

interface Props {
  value?: string;
  multiline?: boolean;
  onChange?(value: string): void;
  onInput?(value: string): void;
}

export function TextField({
  value: currentValue = '',
  onChange,
  onInput,
  multiline,
}: Props) {
  const [value, setValue] = usePartiallyControlledState(currentValue);

  if (multiline) {
    return (
      <div className={styles.TextField}>
        <textarea
          value={value}
          className={classes(styles.Input, multiline && styles.multiline)}
          onChange={({currentTarget}) => {
            setValue(currentTarget.value);
            onInput?.(currentTarget.value);
          }}
          onBlur={() => onChange?.(value)}
        />
      </div>
    );
  }

  return (
    <div className={styles.TextField}>
      <input
        type="text"
        value={value}
        className={styles.Input}
        onChange={({currentTarget}) => {
          setValue(currentTarget.value);
          onInput?.(currentTarget.value);
        }}
        onBlur={() => onChange?.(value)}
      />
    </div>
  );
}

function usePartiallyControlledState(value?: string) {
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
