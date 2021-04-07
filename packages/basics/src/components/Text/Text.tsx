import {ReactNode} from 'react';
import styles from './Text.css';

interface Props {
  children?: ReactNode;
  emphasis?: 'strong' | 'subdued';
}

export function Text({children, emphasis}: Props) {
  let Element: 'span' | 'strong' = 'span';

  switch (emphasis) {
    case 'strong': {
      Element = 'strong';
      break;
    }
  }

  return <Element className={styles.Text}>{children}</Element>;
}
