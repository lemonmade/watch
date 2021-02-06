import {ReactNode, useState} from 'react';
import {classes} from '@lemon/css';

import styles from './Frame.css';

interface Props {
  children?: ReactNode;
  renderNavigation?(): ReactNode;
}

export function Frame({children, renderNavigation}: Props) {
  const navigation = renderNavigation?.() ?? null;
  const [navigationActive, setNavigationActive] = useState(false);

  return (
    <div
      className={classes(
        styles.Frame,
        Boolean(navigation) && styles.hasNavigation,
      )}
    >
      {navigation && (
        <>
          <header className={styles.Header}>
            <button
              type="button"
              className={styles.NavigationActivator}
              onClick={() => setNavigationActive((active) => !active)}
            >
              Menu
            </button>
            {navigationActive && (
              <nav className={styles.NavigationOverlay}>{navigation}</nav>
            )}
          </header>
          <nav className={styles.Navigation}>{navigation}</nav>
        </>
      )}
      <div className={styles.Content}>{children}</div>
    </div>
  );
}
