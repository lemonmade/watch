import type {PropsWithChildren} from 'react';

import {useAutoHeadingLevel} from '../../utilities/headings';

import styles from './Heading.module.css';

interface Props {
  accessibilityRole?: 'heading' | 'presentation';
}

export function Heading({
  children,
  accessibilityRole,
}: PropsWithChildren<Props>) {
  const level = useAutoHeadingLevel();
  const Element: 'p' | 'h1' =
    level == null || accessibilityRole === 'presentation'
      ? 'p'
      : (`h${level}` as 'h1');

  return <Element className={styles.Heading}>{children}</Element>;
}
