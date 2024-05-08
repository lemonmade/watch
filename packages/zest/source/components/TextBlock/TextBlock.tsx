import type {RenderableProps} from 'preact';

import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';

import styles from './TextBlock.module.css';

export type TextBlockProps =
  ReactComponentPropsForClipsElement<'ui-text-block'>;

export function TextBlock({children}: RenderableProps<TextBlockProps>) {
  return <p className={styles.TextBlock}>{children}</p>;
}
