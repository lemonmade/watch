import {type ReactNode, type PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';
import {Pressable, type PressableProps} from '@lemon/zest';

import styles from './MediaGrid.module.css';

interface Props {
  blockSpacing?: 'base' | 'large';
}

export function MediaGrid({children, blockSpacing}: PropsWithChildren<Props>) {
  return (
    <div
      className={classes(
        styles.MediaGrid,
        blockSpacing && styles[variation('blockSpacing', blockSpacing)],
      )}
    >
      {children}
    </div>
  );
}

export interface MediaGridItemProps {
  to?: PressableProps['to'];
  poster: ReactNode;
}

export function MediaGridItem({
  to,
  poster,
  children,
}: PropsWithChildren<MediaGridItemProps>) {
  return (
    <Pressable to={to} className={styles.MediaGridItem} inlineAlignment="start">
      {poster}
      {children}
    </Pressable>
  );
}
