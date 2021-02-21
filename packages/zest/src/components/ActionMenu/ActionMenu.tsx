import type {PropsWithChildren} from 'react';

import styles from './ActionMenu.css';

interface ActionMenuProps {}

export function ActionMenu({children}: PropsWithChildren<ActionMenuProps>) {
  return (
    <div className={styles.ActionMenu} role="menu">
      {children}
    </div>
  );
}
