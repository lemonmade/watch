import type {PropsWithChildren} from 'react';

import {type PropsForClipsComponent} from '../../utilities/clips';

import styles from './TextBlock.module.css';

export type TextBlockProps = PropsForClipsComponent<'TextBlock'>;

export function TextBlock({children}: PropsWithChildren<TextBlockProps>) {
  return <p className={styles.TextBlock}>{children}</p>;
}
