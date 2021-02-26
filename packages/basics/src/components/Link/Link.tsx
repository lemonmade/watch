import type {PropsWithChildren} from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import {Link as RouterLink} from '@quilted/quilt';

import {useImplicitAction} from '../../utilities/actions';
import {useImplicitTarget, ariaForTarget} from '../../utilities/targets';

import styles from './Link.css';

interface Props {
  to: string;
  onPress?(): void;
}

export function Link({to, onPress, children}: PropsWithChildren<Props>) {
  const implicitAction = useImplicitAction();
  const implicitTarget = useImplicitTarget();

  return (
    <RouterLink
      to={to}
      className={styles.Link}
      onClick={
        (implicitAction ?? onPress) &&
        (() => {
          implicitAction?.perform();
          onPress?.();
        })
      }
      {...ariaForTarget(implicitTarget)}
    >
      {children}
    </RouterLink>
  );
}
