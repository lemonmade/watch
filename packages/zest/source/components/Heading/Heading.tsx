import {classes} from '@lemon/css';

import {useHeadingDomDetails} from './shared.ts';

import {type PropsForClipsComponent} from '../../shared/clips.ts';

import styles from './Heading.module.css';

export type HeadingProps = PropsForClipsComponent<'Heading'>;

export function Heading({
  level: explicitLevel,
  children,
  divider,
  accessibilityRole,
}: HeadingProps) {
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
