import React, {ReactNode} from 'react';
import {AutoHeading, AutoHeadingGroup} from '@quilted/quilt';
import styles from './Heading.css';

interface Props {
  children?: ReactNode;
}

export function Heading({children}: Props) {
  return <AutoHeading className={styles.Heading}>{children}</AutoHeading>;
}

export function HeadingGroup({children}: Props) {
  return <AutoHeadingGroup>{children}</AutoHeadingGroup>;
}
