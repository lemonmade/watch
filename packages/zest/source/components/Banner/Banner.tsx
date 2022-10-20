import type {PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import {View} from '../View';
import {NestedHeadingLevel} from '../Heading';

import styles from './Banner.module.css';

interface Props {
  status?: 'information' | 'error';
  padding?: boolean;
}

export function Banner({
  status,
  padding = true,
  children,
}: PropsWithChildren<Props>) {
  return (
    <NestedHeadingLevel>
      <View
        border
        background
        cornerRadius
        padding={padding}
        className={classes(styles.Banner, status === 'error' && styles.error)}
      >
        {children}
      </View>
    </NestedHeadingLevel>
  );
}
