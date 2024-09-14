import type {RenderableProps} from 'preact';
import {classes} from '@lemon/css';

import type {SkeletonTextProperties} from '@watching/clips';

import {CSSLiteral} from '../../system.ts';

import styles from './SkeletonText.module.css';

export interface SkeletonTextProps extends Partial<SkeletonTextProperties> {}

const SIZE_CLASS_MAP = new Map<string, string | undefined>([
  ['small', styles.sizeSmall],
  ['medium', styles.sizeMedium],
  ['large', styles.sizeLarge],
]);

export function SkeletonText({size}: RenderableProps<SkeletonTextProps>) {
  return (
    <span
      className={classes(styles.SkeletonText, size && SIZE_CLASS_MAP.get(size))}
      style={
        CSSLiteral.test(size) ? {inlineSize: CSSLiteral.parse(size)} : undefined
      }
    ></span>
  );
}
