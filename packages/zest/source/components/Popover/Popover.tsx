import type {RenderableProps} from 'preact';
import type {PopoverProperties} from '@watching/clips';

import {Overlay} from '../Overlay';

import styles from './Popover.module.css';

export interface PopoverProps extends Partial<PopoverProperties> {}

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
