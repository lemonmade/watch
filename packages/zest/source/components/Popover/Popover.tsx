import {type PropsWithChildren} from 'react';

import {Overlay, type OverlayProps} from '../Overlay';

import styles from './Popover.module.css';

interface PopoverProps
  extends Pick<OverlayProps, 'blockAttachment' | 'inlineAttachment'> {}

export function Popover(props: PropsWithChildren<PopoverProps>) {
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
