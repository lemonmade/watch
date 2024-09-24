import type {RenderableProps} from 'preact';
import {classes, variation} from '@lemon/css';

import {View} from '../View/View.tsx';
import {NestedHeadingLevel} from '../Heading/Heading.tsx';

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
}: RenderableProps<BannerProps>) {
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
