import type {RenderableProps} from 'preact';

import styles from './Sticky.module.css';

export interface StickyProps {}

export function Sticky({children}: RenderableProps<StickyProps>) {
  return <div className={styles.Sticky}>{children}</div>;
}
