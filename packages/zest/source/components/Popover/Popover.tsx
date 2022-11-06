import {type PropsWithChildren} from 'react';

import {Overlay} from '../Overlay';

import {type PropsForClipsComponent} from '../../utilities/clips';

import styles from './Popover.module.css';

export type PopoverProps = PropsForClipsComponent<'Popover'>;

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
