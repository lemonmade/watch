import type {PropsWithChildren} from 'react';
import {
  View,
  toHeadingLevel,
  AutoHeadingContext,
  useAutoHeadingLevel,
} from '@lemon/basics';
import {classes} from '@lemon/css';

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
  const level = useAutoHeadingLevel() ?? 0;

  return (
    <AutoHeadingContext.Provider value={toHeadingLevel(level + 1)}>
      <View
        border
        background
        cornerRadius
        padding={padding}
        className={classes(styles.Banner, status === 'error' && styles.error)}
      >
        {children}
      </View>
    </AutoHeadingContext.Provider>
  );
}
