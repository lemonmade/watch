import type {PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import styles from './Text.module.css';

interface Props {
  className?: string;
  emphasis?: 'strong' | 'subdued';
  accessibilityRole?: 'code';
}

export function Text({
  className,
  children,
  emphasis,
  accessibilityRole,
}: PropsWithChildren<Props>) {
  const classNames = [styles.Text, accessibilityRole === 'code' && styles.code];

  let Element: 'span' | 'strong' = 'span';

  switch (emphasis) {
    case 'strong': {
      Element = 'strong';
      break;
    }
    case 'subdued': {
      classNames.push(styles.subdued);
      break;
    }
  }

  return (
    <Element className={classes(...classNames, className)}>{children}</Element>
  );
}