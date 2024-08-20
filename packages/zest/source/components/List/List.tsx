import type {RenderableProps} from 'preact';

import styles from './List.module.css';

export interface ListProps {}

export function List({children}: RenderableProps<ListProps>) {
  return <ul className={styles.List}>{children}</ul>;
}

export interface ListItemProps {}

export function ListItem({children}: RenderableProps<ListItemProps>) {
  return <li className={styles.ListItem}>{children}</li>;
}
