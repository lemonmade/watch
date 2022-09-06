import {classes, variation} from '@lemon/css';
import {type SpacingKeyword} from '../../system';
import styles from './Divider.module.css';

export interface Props {
  emphasis?: boolean | 'strong' | 'subdued';
  padding?: boolean | SpacingKeyword;
}

export function Divider({emphasis, padding}: Props) {
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
