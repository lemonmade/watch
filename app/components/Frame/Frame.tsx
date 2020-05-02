import React, {ComponentProps, ReactNode} from 'react';
import {classes} from '@lemon/css';

import {Link} from '../Link';

import styles from './Frame.css';

interface Action {
  to: ComponentProps<typeof Link>['to'];
  content: string;
}

interface Props {
  actions: Action[];
  children?: ReactNode;
}

export function Frame({children, actions}: Props) {
  return (
    <div
      className={classes(
        styles.Frame,
        Boolean(actions?.length) && styles.hasNav,
      )}
    >
      <div className={styles.Content}>{children}</div>

      {Boolean(actions?.length) && <Nav actions={actions} />}
    </div>
  );
}

function Nav({actions}: Pick<Props, 'actions'>) {
  if (actions.length === 0) {
    throw new Error('You must provide at least one action.');
  }

  return (
    <nav className={styles.Nav}>
      <ul className={styles.Actions}>
        {actions.map(({to, content}) => (
          <li key={content}>
            <Link to={to} className={styles.Action}>
              {content}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
