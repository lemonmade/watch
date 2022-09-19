import {type PropsWithChildren, type ReactNode, type ReactElement} from 'react';
import {classes, variation} from '@lemon/css';

import {Icon, type IconSource} from '../Icon';
import {Pressable, type PressableProps} from '../Pressable';

import {
  useConnectedAccessory,
  ConnectedAccessoryContext,
  ConnectedAccessoryReset,
} from '../../utilities/actions';
import {ImplicitPopoverActivation} from '../../utilities/popovers';
import {ImplicitModalActivation} from '../../utilities/overlays';

import type {EmphasisValue, ActionRoleKeyword} from '../../system';

import styles from './Action.module.css';

export type Props = Omit<PressableProps, 'className'> & {
  emphasis?: EmphasisValue;
  loading?: boolean;
  icon?: IconSource | ReactElement;
  secondaryIcon?: IconSource | ReactElement;
  role?: ActionRoleKeyword;
  size?: 'small' | 'base';
  accessory?: ReactNode;
  popover?: ReactNode | false;
  modal?: ReactNode | false;
};

export function Action({popover, modal, ...rest}: PropsWithChildren<Props>) {
  let action = <ActionInternal {...rest} />;

  if (popover !== undefined) {
    action = (
      <ImplicitPopoverActivation popover={popover}>
        {action}
      </ImplicitPopoverActivation>
    );
  } else if (modal !== undefined) {
    action = (
      <ImplicitModalActivation modal={modal}>{action}</ImplicitModalActivation>
    );
  }

  return action;
}

function ActionInternal({
  role,
  disabled,
  emphasis,
  icon,
  secondaryIcon,
  children,
  size,
  accessory,
  loading,
  ...rest
}: PropsWithChildren<Omit<Props, 'popover'>>) {
  const needsGrid = Boolean(children) && Boolean(secondaryIcon || icon);
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
      {secondaryIcon && resolveIcon(secondaryIcon)}
    </>
  );

  const pressable = (
    <Pressable
      {...(rest as any)}
      className={classes(
        styles.Action,
        (finalEmphasis === true || finalEmphasis === 'emphasized') &&
          styles.emphasized,
        finalEmphasis === 'subdued' && styles.subdued,
        finalRole === 'destructive' && styles.destructive,
        Boolean(icon) && styles.hasIcon,
        Boolean(secondaryIcon) && styles.hasSecondaryIcon,
        needsGrid && styles.spacing,
        size && styles[variation('size', size)],
        accessory && styles.connectedMain,
        Boolean(connectedAccessory) && styles.connectedAccessory,
      )}
      disabled={finalDisabled}
      display={needsGrid ? 'inlineGrid' : 'inlineFlex'}
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
}

function resolveIcon(icon: IconSource | ReactElement) {
  return typeof icon === 'string' ? <Icon source={icon} /> : icon;
}
