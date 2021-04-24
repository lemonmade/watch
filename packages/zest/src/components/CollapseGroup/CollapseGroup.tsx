import {ReactNode} from 'react';
import styles from './CollapseGroup.module.css';

interface Props {
  title: string;
  children?: ReactNode;
}

export function CollapseGroup({title, children}: Props) {
  return (
    <div className={styles.CollapseGroup}>
      <div className={styles.Heading}>{title}</div>
      <div className={styles.Content}>{children}</div>
    </div>
  );
}
