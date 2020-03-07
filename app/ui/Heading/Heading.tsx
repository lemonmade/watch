import React from 'react';
import {AutoHeading} from '@quilted/quilt';
import {ReactPropsFromRemoteComponentType} from '@remote-ui/react';
import styles from './Heading.css';

type Props = ReactPropsFromRemoteComponentType<
  typeof import('components').Heading
>;

export function Heading({children}: Props) {
  return <AutoHeading className={styles.Heading}>{children}</AutoHeading>;
}
