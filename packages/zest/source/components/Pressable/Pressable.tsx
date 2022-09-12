import {type PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';
import {Link, type NavigateTo} from '@quilted/quilt';

import systemStyles from '../../system.module.css';
import {useContainingForm} from '../../utilities/forms';
import {
  useImplicitAction,
  ariaForAction,
  type ImplicitActionType,
} from '../../utilities/actions';

import styles from './Pressable.module.css';

export type Props = {
  id?: string;
  className?: string;
  display?: 'block' | 'flex' | 'inlineFlex' | 'grid' | 'inlineGrid';
  inlineAlignment?: 'start' | 'end' | 'center';
  disabled?: boolean;
  type?: ImplicitActionType | 'none';
  accessibilityLabel?: string;
  onPress?(): void;
} & (
  | {type?: ImplicitActionType; to?: never; target?: never}
  | {to: NavigateTo; target?: 'new' | 'current'}
);

export function Pressable({
  id,
  to,
  className: explicitClassName,
  target,
  children,
  display,
  inlineAlignment,
  disabled,
  type = 'activation',
  onPress,
  accessibilityLabel,
}: PropsWithChildren<Props>) {
  const implicitAction = useImplicitAction(id);
  const allowedImplicitAction =
    implicitAction == null || to != null || type === 'none'
      ? undefined
      : type === implicitAction.type
      ? implicitAction
      : undefined;

  const form = useContainingForm();

  const className = classes(
    display && systemStyles[variation('display', display)],
    inlineAlignment &&
      systemStyles[variation('inlineAlignment', inlineAlignment)],
    styles.Pressable,
    disabled && styles.disabled,
    explicitClassName,
  );

  const handleClick = () => {
    if (onPress) {
      onPress();
    } else {
      allowedImplicitAction?.perform?.();
    }
  };

  if (to != null) {
    const externalProps =
      target === 'new' ? {target: '_blank', rel: 'noopener noreferrer'} : {};

    return (
      <Link
        to={to}
        className={className}
        onClick={handleClick}
        {...externalProps}
      >
        {children}
      </Link>
    );
  }

  const submitButton = allowedImplicitAction?.type === 'submit';

  return (
    <button
      type={submitButton ? 'submit' : 'button'}
      form={submitButton && form?.nested ? form.id : undefined}
      disabled={disabled}
      className={className}
      onClick={handleClick}
      aria-label={accessibilityLabel}
      {...ariaForAction(allowedImplicitAction)}
    >
      {children}
    </button>
  );
}
