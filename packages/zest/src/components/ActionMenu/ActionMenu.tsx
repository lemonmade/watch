import type {PropsWithChildren} from 'react';

import styles from './ActionMenu.css';

interface ActionMenuProps {}

export function ActionMenu({children}: PropsWithChildren<ActionMenuProps>) {
  return <ul className={styles.ActionMenu}>{children}</ul>;
}

interface ActionMenuItemProps {
  onPress?(): void;
}

export function ActionMenuItem({
  children,
  onPress,
}: PropsWithChildren<ActionMenuItemProps>) {
  return (
    <li className={styles.ActionMenuItem}>
      <button
        className={styles.ActionMenuItemAction}
        type="button"
        onClick={onPress}
      >
        {children}
      </button>
    </li>
  );
}
