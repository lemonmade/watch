import {type ReactNode} from 'react';

import {InlineStack} from '../InlineStack';

import styles from './DatePicker.module.css';

interface Props {
  id?: string;
  label: ReactNode;
  value?: Date;
  onChange(value: Date): void;
}

export function DatePicker({id, label, value, onChange}: Props) {
  return (
    <InlineStack spacing="small">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={
          value == null
            ? new Date().toISOString()
            : `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
                2,
                '0',
              )}-${String(value.getDate()).padStart(2, '0')}`
        }
        type="date"
        className={styles.DatePicker}
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
    </InlineStack>
  );
}
