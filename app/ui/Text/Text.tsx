import React from 'react';
import {ReactPropsFromRemoteComponentType} from '@remote-ui/react';

import styles from './Text.css';

type Props = ReactPropsFromRemoteComponentType<
  typeof import('components').Text
>;

export function Text({children}: Props) {
  return <p className={styles.Text}>{children}</p>;
}
