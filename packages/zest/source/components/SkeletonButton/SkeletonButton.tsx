import type {RenderableProps} from 'preact';
import {classes} from '@lemon/css';
import type {SkeletonButtonProperties} from '@watching/clips';

import {CSSLiteral} from '../../system.ts';

import styles from './SkeletonButton.module.css';

export interface SkeletonButtonProps
  extends Partial<SkeletonButtonProperties> {}

const SIZE_CLASS_MAP = new Map<string, string | undefined>([
  ['small.1', styles.sizeSmall],
  ['small', styles.sizeSmall],
  ['auto', styles.sizeAuto],
  ['large', styles.sizeLarge],
  ['large.1', styles.sizeLarge],
]);

export function SkeletonButton({size}: RenderableProps<SkeletonButtonProps>) {
  return (
    <span
      className={classes(
        styles.SkeletonButton,
        size && SIZE_CLASS_MAP.get(size),
      )}
      style={
        CSSLiteral.test(size)
          ? {'--z-internal-SkeletonButton-content-size': CSSLiteral.parse(size)}
          : undefined
      }
    />
  );
}
