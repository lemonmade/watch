import type {RenderableProps} from 'preact';

import {Overlay} from '../Overlay';

import {type PreactComponentPropsForClipsElement} from '../../shared/clips.ts';

import styles from './Popover.module.css';

export type PopoverProps = PreactComponentPropsForClipsElement<'ui-popover'>;

export function Popover(props: RenderableProps<PopoverProps>) {
  return (
    <Overlay
      {...props}
      relativeTo="trigger"
      className={styles.Popover}
      classNameOpenStart={styles.transitionOpenStart}
      classNameOpenEnd={styles.transitionOpenEnd}
      classNameCloseEnd={styles.transitionCloseEnd}
    />
  );
}
