import type {ReactNode} from 'react';
import styles from './List.module.css';

export function List({children}: {children?: ReactNode}) {
  return <ul className={styles.List}>{children}</ul>;
}

export function ListItem({children}: {children?: ReactNode}) {
  return <li className={styles.ListItem}>{children}</li>;
}
