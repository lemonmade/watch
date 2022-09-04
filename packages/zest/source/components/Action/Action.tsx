import {type PropsWithChildren, type ReactNode} from 'react';
import {classes} from '@lemon/css';
import {Pressable, type PressableProps} from '../Pressable';

import styles from './Action.module.css';

export type Props = Omit<PressableProps, 'className'> & {
  primary?: boolean;
  loading?: boolean;
  accessory?: ReactNode;
};

export function Action({
  disabled,
  primary,
  accessory,
  children,
  ...rest
}: PropsWithChildren<Props>) {
  const content = (
    <>
      {accessory ? (
        <span className={styles.ContentContainer}>{children}</span>
      ) : (
        children
      )}
      {accessory}
    </>
  );

  return (
    <Pressable
      {...(rest as any)}
      className={classes(
        styles.Action,
        disabled && styles.disabled,
        primary && styles.primary,
        Boolean(accessory) && styles.hasAccessory,
      )}
      disabled={disabled}
    >
      {content}
    </Pressable>
  );
}
