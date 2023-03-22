import {type ReactNode} from 'react';

import {useStackProps, resolveStackProps} from '../Stack.tsx';

import styles from './DateField.module.css';

export interface DateFieldProps {
  id?: string;
  label: ReactNode;
  value: Date;
  onChange(value: Date): void;
}

export function DateField({id, label, value, onChange}: DateFieldProps) {
  const stack = useStackProps({spacing: 'small'});

  return (
    <div {...resolveStackProps(stack)}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={`${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
          2,
          '0',
        )}-${String(value.getDate()).padStart(2, '0')}`}
        type="date"
        className={styles.DateField}
        onChange={({currentTarget}) => {
          const [year, month, day] = currentTarget.value.split('-');

          onChange(
            new Date(
              parseInt(year!, 10),
              parseInt(month!, 10) - 1,
              parseInt(day!, 10),
            ),
          );
        }}
      />
    </div>
  );
}
