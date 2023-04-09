import type {PropsWithChildren} from 'react';

import {type PropsForClipsComponent} from '../../shared/clips.ts';

import styles from './TextBlock.module.css';

export type TextBlockProps = PropsForClipsComponent<'TextBlock'>;

export function TextBlock({children}: PropsWithChildren<TextBlockProps>) {
  return <p className={styles.TextBlock}>{children}</p>;
}
