import {type PropsWithChildren, type ReactNode} from 'react';
import {classes, variation} from '@lemon/css';
import {Pressable, type PressableProps} from '../Pressable';

import styles from './Action.module.css';

export type Props = Omit<PressableProps, 'className'> & {
  emphasis?: boolean | 'subdued' | 'emphasized';
  loading?: boolean;
  icon?: ReactNode;
  accessory?: ReactNode;
  role?: 'destructive';
  size?: 'small' | 'base';
};

export function Action({
  role,
  disabled,
  emphasis,
  icon,
  accessory,
  children,
  size,
  ...rest
}: PropsWithChildren<Props>) {
  const needsGrid = Boolean(children) && Boolean(accessory || icon);
  const needsBackdrop = size === 'small';

  const content = (
    <>
      {icon}
      {needsGrid ? <span>{children}</span> : children}
      {accessory}
    </>
  );

  return (
    <Pressable
      {...(rest as any)}
      className={classes(
        styles.Action,
        disabled && styles.disabled,
        (emphasis === true || emphasis === 'emphasized') && styles.emphasized,
        emphasis === 'subdued' && styles.subdued,
        role === 'destructive' && styles.destructive,
        Boolean(icon) && styles.hasIcon,
        Boolean(accessory) && styles.hasAccessory,
        needsGrid && styles.spacing,
        size && styles[variation('size', size)],
      )}
      disabled={disabled}
      display={needsGrid ? 'inlineGrid' : 'inlineFlex'}
    >
      {content}
      {needsBackdrop && <span className={styles.Backdrop} />}
    </Pressable>
  );
}
