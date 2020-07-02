import React, {ReactNode} from 'react';
import {Heading, HeadingGroup} from '../Heading';
import styles from './Page.css';

interface Props {
  title?: string;
  children?: ReactNode;
}

export function Page({title, children}: Props) {
  return (
    <div className={styles.Page}>
      {title && (
        <header className={styles.Header}>
          <Heading>{title}</Heading>
        </header>
      )}
      <HeadingGroup>
        <div className={styles.Content}>{children}</div>
      </HeadingGroup>
    </div>
  );
}
