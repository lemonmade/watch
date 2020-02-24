import React from 'react';
import {ReactPropsFromRemoteComponentType} from '@remote-ui/react';
import styles from './DateField.css';

type Props = ReactPropsFromRemoteComponentType<
  typeof import('components').DateField
>;

export function DateField({id, label, value, onChange}: Props) {
  return (
    <>
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
              parseInt(year, 10),
              parseInt(month, 10) - 1,
              parseInt(day, 10),
            ),
          );
        }}
      />
    </>
  );
}
