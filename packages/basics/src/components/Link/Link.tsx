import type {PropsWithChildren} from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import {Link as RouterLink} from '@quilted/quilt';
import {classes, variation} from '@lemon/css';

import {useImplicitAction, ariaForTarget} from '../../utilities/actions';

import styles from './Link.css';

interface Props {
  to: string;
  onPress?(): void;
  blockSize?: 'fill';
  alignContent?: 'start' | 'end' | 'center';
}

export function Link({
  to,
  onPress,
  alignContent,
  blockSize,
  children,
}: PropsWithChildren<Props>) {
  const implicitAction = useImplicitAction();

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
      {...ariaForTarget(implicitAction?.target)}
    >
      {children}
    </RouterLink>
  );
}
