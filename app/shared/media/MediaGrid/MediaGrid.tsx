import {type PropsWithChildren} from '@quilted/quilt';
import {classes, variation} from '@lemon/css';
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
