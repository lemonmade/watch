import type {PropsWithChildren, ComponentProps} from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import {Link as RouterLink} from '@quilted/quilt';
import {classes, variation} from '@lemon/css';

import {useImplicitAction, ariaForAction} from '../../utilities/actions';

import styles from './Link.module.css';

interface Props {
  to: ComponentProps<typeof RouterLink>['to'];
  target?: 'currentTab' | 'newTab';
  onPress?(): void;
  blockSize?: 'fill';
  alignContent?: 'start' | 'end' | 'center';
}

export function Link({
  to,
  target,
  onPress,
  alignContent,
  blockSize,
  children,
}: PropsWithChildren<Props>) {
  const implicitAction = useImplicitAction();

  const externalProps =
    target === 'newTab' ? {target: '_blank', rel: 'noopener noreferrer'} : {};

  return (
    <RouterLink
      to={to}
      className={classes(
        styles.Link,
        alignContent && styles[variation('alignContent', alignContent)],
        blockSize && styles[variation('blockSize', blockSize)],
      )}
      onClick={
        (implicitAction ?? onPress) &&
        (() => {
          implicitAction?.perform();
          onPress?.();
        })
      }
      {...ariaForAction(implicitAction)}
      {...externalProps}
    >
      {children}
    </RouterLink>
  );
}
