import type {RenderableProps} from 'preact';

import {type PreactComponentPropsForClipsElement} from '../../shared/clips.ts';

import styles from './TextBlock.module.css';

export type TextBlockProps =
  PreactComponentPropsForClipsElement<'ui-text-block'>;

export function TextBlock({children}: RenderableProps<TextBlockProps>) {
  return <p className={styles.TextBlock}>{children}</p>;
}
