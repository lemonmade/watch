import type {PropsWithChildren} from 'react';

import {toProps, useDomProps} from '../../system';
import type {SystemProps} from '../../system';

import styles from './Text.css';

interface Props extends SystemProps {
  emphasis?: 'strong' | 'subdued';
}

export function Text({
  children,
  emphasis,
  ...systemProps
}: PropsWithChildren<Props>) {
  const dom = useDomProps({...systemProps, display: 'inline'});
  dom.addClassName(styles.Text);

  let Element: 'span' | 'strong' = 'span';

  switch (emphasis) {
    case 'strong': {
      Element = 'strong';
      break;
    }
  }

  return <Element {...toProps(dom)}>{children}</Element>;
}
