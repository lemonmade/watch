import {ReactNode} from 'react';
import styles from './MediaGrid.module.css';

interface Props {
  children?: ReactNode;
}

export function MediaGrid({children}: Props) {
  return <div className={styles.MediaGrid}>{children}</div>;
}
