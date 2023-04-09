import type {PropsWithChildren} from 'react';

import styles from './List.module.css';

export interface ListProps {}

export function List({children}: PropsWithChildren<ListProps>) {
  return <ul className={styles.List}>{children}</ul>;
}

export interface ListItemProps {}

export function ListItem({children}: PropsWithChildren<ListItemProps>) {
  return <li className={styles.ListItem}>{children}</li>;
}
