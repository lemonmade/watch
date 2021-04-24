import type {PropsWithChildren} from 'react';

import {toProps, useDomProps} from '../../system';
import type {SystemProps} from '../../system';

import styles from './Label.css';

interface Props extends SystemProps {
  target: string;
}

export function Label({
  target,
  children,
  ...systemProps
}: PropsWithChildren<Props>) {
  const dom = useDomProps(systemProps);
  dom.addClassName(styles.Label);

  return (
    <label htmlFor={target} {...toProps(dom)}>
      {children}
    </label>
  );
}
