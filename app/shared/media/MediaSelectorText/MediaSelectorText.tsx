import type {EpisodeSelector, SeasonSelector} from '@watching/api';
import {Text, type TextProps} from '@lemon/zest';

import styles from './MediaSelectorText.module.css';

export interface MediaSelectorTextProps extends TextProps {
  children: EpisodeSelector | SeasonSelector;
}

export function MediaSelectorText({children, ...rest}: MediaSelectorTextProps) {
  return (
    <Text className={styles.MediaSelector} {...rest}>
      {children}
    </Text>
  );
}
