import type {PropsWithChildren} from 'react';

import {toProps, useDomProps} from '../../system';
import type {SystemProps} from '../../system';

import styles from './TextBlock.css';

interface Props extends SystemProps {}

export function TextBlock({
  children,
  ...systemProps
}: PropsWithChildren<Props>) {
  const dom = useDomProps(systemProps);
  dom.addClassName(styles.TextBlock);

  return <p {...toProps(dom)}>{children}</p>;
}
