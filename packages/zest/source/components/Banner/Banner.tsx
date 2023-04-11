import type {PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';

import {View} from '../View.tsx';
import {NestedHeadingLevel} from '../Heading.tsx';

import styles from './Banner.module.css';

export interface BannerProps {
  tone?:
    | 'neutral'
    | 'critical'
    | 'positive'
    // TODO
    | 'highlight'
    | 'caution';
  padding?: boolean;
}

export function Banner({
  tone,
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
          tone && styles[variation('tone', tone)],
        )}
      >
        {children}
      </View>
    </NestedHeadingLevel>
  );
}
