import React, {useState, useRef, useCallback} from 'react';
import {classes} from '@lemon/css';
import styles from './TextField.css';

interface Props {
  initialValue?: string;
  multiline?: boolean;
  onChange(value: string): void;
}

export function TextField({initialValue = '', onChange, multiline}: Props) {
  const [value, setValue] = usePartiallyControlledState(initialValue, onChange);

  if (multiline) {
    return (
      <div className={styles.TextField}>
        <textarea
          value={value}
          className={classes(styles.Input, multiline && styles.multiline)}
          onChange={({currentTarget}) => setValue(currentTarget.value)}
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
        onChange={({currentTarget}) => setValue(currentTarget.value)}
      />
    </div>
  );
}

function usePartiallyControlledState<T>(
  initialValue: T,
  onChange?: (value: T) => void,
) {
  const [currentValue, setCurrentValue] = useState(initialValue);
  const lastValue = useRef(initialValue);

  if (lastValue.current !== initialValue) {
    lastValue.current = initialValue;
    setCurrentValue(initialValue);
  }

  const setValue = useCallback(
    (value: T) => {
      setCurrentValue(value);
      onChange?.(value);
    },
    [onChange],
  );

  return [currentValue, setValue] as const;
}
