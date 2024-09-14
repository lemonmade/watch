import type {RenderableProps} from 'preact';
import {classes} from '@lemon/css';
import type {HeadingLevel} from '@watching/design';
import type {HeadingProperties} from '@watching/clips';

import {useHeadingDomDetails} from './shared.ts';

import styles from './Heading.module.css';

export interface HeadingProps extends Partial<HeadingProperties> {
  level?: HeadingLevel | 'auto';
}

export function Heading({
  level: explicitLevel,
  children,
  divider,
  accessibilityRole,
}: RenderableProps<HeadingProps>) {
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
