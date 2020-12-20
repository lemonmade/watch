import React, {ReactNode, ComponentProps} from 'react';
import {Link, useMatch} from '@quilted/quilt';
import {classes} from '@lemon/css';
import styles from './NavigationList.css';

interface Props {
  children?: ReactNode;
}

export function NavigationList({children}: Props) {
  return <div className={styles.NavigationList}>{children}</div>;
}

interface ItemProps {
  to: Extract<
    Parameters<typeof useMatch>[0],
    ComponentProps<typeof Link>['to']
  >;
  children?: ReactNode;
}

export function NavigationListItem({to, children}: ItemProps) {
  const active = useMatch(to);

  return (
    <Link
      to={to}
      className={classes(styles.Item, active && styles['Item-active'])}
    >
      {children}
    </Link>
  );
}
