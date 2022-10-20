import {type PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import {
  useHeadingDomDetails,
  type HeadingLevel,
  type HeadingAccessibilityRole,
} from './shared';

import styles from './Heading.module.css';

export interface HeadingProps {
  level?: HeadingLevel;
  accessibilityRole?: HeadingAccessibilityRole;
  divider?: boolean;
}

export function Heading({
  level: explicitLevel,
  children,
  divider,
  accessibilityRole,
}: PropsWithChildren<HeadingProps>) {
  const {level, Element} = useHeadingDomDetails({
    level: explicitLevel,
    accessibilityRole,
  });

  return (
    <Element
      className={classes(
        styles.Heading,
        styles[`level${explicitLevel ?? level}`],
        divider && styles.divider,
      )}
    >
      {children}
    </Element>
  );
}
