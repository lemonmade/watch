import {useState, useRef} from 'react';
import type {PropsWithChildren, ChangeEvent} from 'react';
import {classes, variation} from '@lemon/css';
import styles from './TextField.css';

interface Props {
  value?: string;
  multiline?: boolean | number;
  blockSize?: 'fitContent';
  onInput?(value: string): void;
  onChange?(value: string): void;
}

export function TextField({
  value: currentValue,
  multiline = false,
  blockSize = multiline === true ? 'fitContent' : undefined,
  onInput,
  onChange,
}: PropsWithChildren<Props>) {
  const [value, setValue] = usePartiallyControlledState(currentValue);
  const InputElement = multiline ? 'textarea' : 'input';

  const style =
    typeof multiline === 'number'
      ? {'--x-TextField-lines': multiline}
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
      <div className={styles.InputContainer}>
        <InputElement
          type={multiline ? undefined : 'text'}
          className={styles.Input}
          value={value}
          onChange={({
            currentTarget,
          }: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setValue(currentTarget.value);
            onInput?.(currentTarget.value);
          }}
          onBlur={() => onChange?.(value ?? '')}
        />
        {blockSize === 'fitContent' && (
          <div className={styles.AutoGrowWrap}>{value} </div>
        )}
      </div>
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
