import React, {ReactNode} from 'react';
import {classes} from '@lemon/css';

import styles from './Frame.css';

interface Props {
  children?: ReactNode;
  renderNavigation?(): ReactNode;
}

export function Frame({children, renderNavigation}: Props) {
  const navigation = renderNavigation?.() ?? null;

  return (
    <div
      className={classes(
        styles.Frame,
        Boolean(navigation) && styles.hasNavigation,
      )}
    >
      {navigation && <nav className={styles.Navigation}>{navigation}</nav>}
      <div className={styles.Content}>{children}</div>
    </div>
  );
}
