import {
  forwardRef,
  type ReactNode,
  type ReactElement,
  type PropsWithChildren,
} from 'react';
import {classes, variation} from '@lemon/css';

import {Icon, type IconSource} from '../Icon';
import {Pressable, type PressableProps} from '../Pressable';

import {
  useConnectedAccessory,
  ConnectedAccessoryContext,
  ConnectedAccessoryReset,
} from '../../utilities/actions';

import type {EmphasisValue, ActionRoleKeyword} from '../../system';

import styles from './Action.module.css';

export type Props = Omit<PressableProps, 'className' | 'display'> & {
  emphasis?: EmphasisValue;
  loading?: boolean;
  selected?: boolean;
  icon?: IconSource | ReactElement;
  detail?: ReactElement;
  role?: ActionRoleKeyword;
  size?: 'small' | 'base';
  accessory?: ReactNode;
  inlineSize?: 'content' | 'fill';
};

export const Action = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  PropsWithChildren<Props>
>(function Action(
  {
    role,
    disabled,
    emphasis,
    icon,
    detail,
    children,
    size,
    accessory,
    loading,
    inlineSize,
    selected,
    ...rest
  },
  ref,
) {
  const needsGrid = Boolean(children) && Boolean(detail || icon);
  const connectedAccessory = useConnectedAccessory();

  let finalEmphasis = emphasis;
  let finalRole = role;
  const finalDisabled = disabled || loading || false;

  if (connectedAccessory) {
    finalEmphasis = connectedAccessory.emphasis ?? finalEmphasis;
    finalRole = connectedAccessory.role ?? finalRole;
  }

  const content = (
    <>
      {icon && resolveIcon(icon)}
      {needsGrid ? <span>{children}</span> : children}
      {detail}
    </>
  );

  const pressable = (
    <Pressable
      {...(rest as any)}
      ref={ref}
      className={classes(
        styles.Action,
        (finalEmphasis === true || finalEmphasis === 'emphasized') &&
          styles.emphasized,
        finalEmphasis === 'subdued' && styles.subdued,
        finalRole === 'destructive' && styles.destructive,
        selected && styles.selected,
        Boolean(icon) && styles.hasIcon,
        Boolean(detail) && styles.hasDetail,
        needsGrid && styles.spacing,
        size && styles[variation('size', size)],
        accessory && styles.connectedMain,
        Boolean(connectedAccessory) && styles.connectedAccessory,
      )}
      disabled={finalDisabled}
      display={
        needsGrid
          ? inlineSize === 'fill'
            ? 'grid'
            : 'inlineGrid'
          : inlineSize === 'fill'
          ? 'flex'
          : 'inlineFlex'
      }
    >
      {content}
    </Pressable>
  );

  return accessory ? (
    <span className={styles.ActionContainer}>
      <ConnectedAccessoryReset>{pressable}</ConnectedAccessoryReset>
      <ConnectedAccessoryContext role={finalRole} emphasis={finalEmphasis}>
        {accessory}
      </ConnectedAccessoryContext>
    </span>
  ) : (
    pressable
  );
});

function resolveIcon(icon: IconSource | ReactElement) {
  return typeof icon === 'string' ? <Icon source={icon} /> : icon;
}
