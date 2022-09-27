import {type PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import {useAutoHeadingLevel, toHeadingLevel} from '../../utilities/headings';

import styles from './Heading.module.css';

interface Props {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  divider?: boolean;
  accessibilityRole?: 'heading' | 'presentation';
}

export function Heading({
  level: explicitLevel,
  children,
  divider,
  accessibilityRole,
}: PropsWithChildren<Props>) {
  const level = useAutoHeadingLevel();
  const role =
    accessibilityRole ??
    (explicitLevel == null || explicitLevel === level
      ? 'heading'
      : 'presentation');

  const Element =
    role === 'presentation' ? 'p' : (`h${toHeadingLevel(level)}` as const);

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
