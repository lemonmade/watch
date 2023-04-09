import type {PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';

import {View} from '../View.tsx';
import {NestedHeadingLevel} from '../Heading.tsx';

import styles from './Banner.module.css';

export interface BannerProps {
  status?: 'information' | 'error' | 'success';
  padding?: boolean;
}

export function Banner({
  status,
  padding = true,
  children,
}: PropsWithChildren<BannerProps>) {
  return (
    <NestedHeadingLevel>
      <View
        border
        background
        cornerRadius
        padding={padding}
        className={classes(
          styles.Banner,
          status && styles[variation('status', status)],
        )}
      >
        {children}
      </View>
    </NestedHeadingLevel>
  );
}
