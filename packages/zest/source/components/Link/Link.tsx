import type {PropsWithChildren, ComponentProps, ReactNode} from 'react';
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
  accessory?: ReactNode;
}

export function Link({
  to,
  target,
  onPress,
  alignContent,
  blockSize,
  children,
  accessory,
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
        Boolean(accessory) && styles.hasAccessory,
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
      {accessory ? (
        <span className={styles.ContentContainer}>{children}</span>
      ) : (
        children
      )}
      {accessory}
    </RouterLink>
  );
}
