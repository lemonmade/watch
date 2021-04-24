import type {PropsWithChildren} from 'react';

import styles from './Menu.module.css';

interface MenuProps {}

export function Menu({children}: PropsWithChildren<MenuProps>) {
  return (
    <div className={styles.Menu} role="menu">
      {children}
    </div>
  );
}
