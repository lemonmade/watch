import {type PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import {Icon} from '../Icon';
import {Pressable, type PressableProps} from '../Pressable';
import systemStyles from '../../system.module.css';

import styles from './ContentAction.module.css';

export interface ContentActionProps
  extends Pick<
    PressableProps,
    'to' | 'onPress' | 'perform' | 'postPerform' | 'modal' | 'popover'
  > {}

export function ContentAction({
  children,
  ...pressableProps
}: PropsWithChildren<ContentActionProps>) {
  return (
    <Pressable
      {...pressableProps}
      inlineAlignment="start"
      className={classes(systemStyles.displayInlineGrid, styles.ContentAction)}
    >
      <div className={styles.Content}>{children}</div>
      <div className={styles.Icon}>
        <Icon source="more" />
      </div>
    </Pressable>
  );
}
