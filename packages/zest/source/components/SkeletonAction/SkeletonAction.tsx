import type {RenderableProps} from 'preact';
import {classes} from '@lemon/css';
import type {SkeletonActionProperties} from '@watching/clips';

import {CSSLiteral} from '../../system.ts';

import styles from './SkeletonAction.module.css';

export interface SkeletonActionProps
  extends Partial<SkeletonActionProperties> {}

const SIZE_CLASS_MAP = new Map<string, string | undefined>([
  ['small.1', styles.sizeSmall],
  ['small', styles.sizeSmall],
  ['auto', styles.sizeAuto],
  ['large', styles.sizeLarge],
  ['large.1', styles.sizeLarge],
]);

export function SkeletonAction({size}: RenderableProps<SkeletonActionProps>) {
  return (
    <span
      className={classes(
        styles.SkeletonAction,
        size && SIZE_CLASS_MAP.get(size),
      )}
      style={
        CSSLiteral.test(size)
          ? {'--z-internal-SkeletonAction-content-size': CSSLiteral.parse(size)}
          : undefined
      }
    />
  );
}
