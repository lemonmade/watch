import React, {ReactNode} from 'react';
import styles from './Text.css';

interface Props {
  children?: ReactNode;
}

export function Text({children}: Props) {
  return <p className={styles.Text}>{children}</p>;
}
