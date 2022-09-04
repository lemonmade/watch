import {type PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';
import {Link, type NavigateTo} from '@quilted/quilt';

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
  blockSize?: 'fill';
  alignContent?: 'start' | 'end' | 'center';
  disabled?: boolean;
  type?: ImplicitActionType | 'none';
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
  blockSize,
  alignContent,
  disabled,
  type = 'activation',
  onPress,
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
    styles.Pressable,
    disabled && styles.disabled,
    alignContent && styles[variation('alignContent', alignContent)],
    blockSize && styles[variation('blockSize', blockSize)],
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
      {...ariaForAction(allowedImplicitAction)}
    >
      {children}
    </button>
  );
}
