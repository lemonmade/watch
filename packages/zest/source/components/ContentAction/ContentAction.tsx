import type {RenderableProps} from 'preact';
import {classes} from '@lemon/css';

import {Icon} from '../Icon.tsx';
import {Pressable, type PressableProps} from '../Pressable.tsx';

import systemStyles from '../../system.module.css';

import styles from './ContentAction.module.css';

export interface ContentActionProps
  extends Pick<
    PressableProps,
    'to' | 'onPress' | 'perform' | 'postPerform' | 'overlay'
  > {}

export function ContentAction({
  children,
  ...pressableProps
}: RenderableProps<ContentActionProps>) {
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
