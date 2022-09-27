import {type PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import styles from './Tag.module.css';

export interface TagProps {}

export function Tag({children}: PropsWithChildren<TagProps>) {
  return <span className={classes(styles.Tag)}>{children}</span>;
}
