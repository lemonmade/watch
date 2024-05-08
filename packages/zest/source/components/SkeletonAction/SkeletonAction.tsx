import type {RenderableProps} from 'preact';
import {classes} from '@lemon/css';

import {CSSLiteral} from '../../system.ts';
import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';

import styles from './SkeletonAction.module.css';

export type SkeletonActionProps =
  ReactComponentPropsForClipsElement<'ui-skeleton-action'>;

const SIZE_CLASS_MAP = new Map<string, string | undefined>([
  ['small', styles.sizeSmall],
  ['medium', styles.sizeMedium],
  ['large', styles.sizeLarge],
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
