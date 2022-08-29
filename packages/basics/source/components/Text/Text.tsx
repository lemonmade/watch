import type {PropsWithChildren} from 'react';

import {toProps, useDomProps} from '../../system';
import type {SystemProps} from '../../system';

import styles from './Text.module.css';

interface Props extends SystemProps {
  emphasis?: 'strong' | 'subdued';
  accessibilityRole?: 'code';
}

export function Text({
  children,
  emphasis,
  accessibilityRole,
  ...systemProps
}: PropsWithChildren<Props>) {
  const dom = useDomProps({...systemProps, display: 'inline'});
  dom.addClassName(styles.Text, accessibilityRole === 'code' && styles.code);

  let Element: 'span' | 'strong' = 'span';

  switch (emphasis) {
    case 'strong': {
      Element = 'strong';
      break;
    }
    case 'subdued': {
      dom.addClassName(styles.subdued);
      break;
    }
  }

  return <Element {...toProps(dom)}>{children}</Element>;
}
