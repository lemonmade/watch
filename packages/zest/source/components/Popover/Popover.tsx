import {type PropsWithChildren} from 'react';

import {Overlay} from '../Overlay';

import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';

import styles from './Popover.module.css';

export type PopoverProps = ReactComponentPropsForClipsElement<'ui-popover'>;

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
