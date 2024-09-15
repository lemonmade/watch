import type {RenderableProps} from 'preact';
import type {TextBlockProperties} from '@watching/clips';

import styles from './TextBlock.module.css';

export interface TextBlockProps extends Partial<TextBlockProperties> {}

export function TextBlock({children}: RenderableProps<TextBlockProps>) {
  return <p className={styles.TextBlock}>{children}</p>;
}
