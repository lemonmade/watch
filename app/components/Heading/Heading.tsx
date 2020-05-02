import React, {ReactNode} from 'react';
import {AutoHeading} from '@quilted/quilt';
import styles from './Heading.css';

interface Props {
  children?: ReactNode;
}

export function Heading({children}: Props) {
  return <AutoHeading className={styles.Heading}>{children}</AutoHeading>;
}
