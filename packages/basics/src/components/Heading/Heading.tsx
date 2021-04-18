import type {PropsWithChildren} from 'react';

import {toProps, useDomProps} from '../../system';
import type {SystemProps} from '../../system';

import {useAutoHeadingLevel} from '../../utilities/headings';

import styles from './Heading.css';

interface Props extends SystemProps {
  accessibilityRole?: 'heading' | 'presentation';
}

export function Heading({
  children,
  accessibilityRole,
  ...systemProps
}: PropsWithChildren<Props>) {
  const level = useAutoHeadingLevel();
  const Element =
    level == null || accessibilityRole === 'presentation' ? 'p' : `h${level}`;

  const dom = useDomProps(systemProps);
  dom.addClassName(styles.Heading);

  return <Element {...toProps(dom)}>{children}</Element>;
}
