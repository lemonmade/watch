import {classes, variation} from '@lemon/css';
import {type SpacingKeyword} from '../../system.ts';
import styles from './Divider.module.css';

export interface DividerProps {
  emphasis?: boolean | 'strong' | 'subdued';
  padding?: boolean | SpacingKeyword;
}

export function Divider({emphasis, padding}: DividerProps) {
  return (
    <hr
      className={classes(
        styles.Divider,
        (emphasis === true || emphasis === 'strong') && styles.emphasized,
        emphasis === 'subdued' && styles.subdued,
        padding === true && styles.paddingBase,
        typeof padding === 'string' && styles[variation('padding', padding)],
      )}
    />
  );
}
