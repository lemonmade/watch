import {classes} from '@lemon/css';
import styles from './Divider.module.css';

export interface Props {
  emphasis?: boolean | 'strong' | 'subdued';
  padding?: boolean | 'none' | 'base';
}

export function Divider({emphasis, padding}: Props) {
  return (
    <hr
      className={classes(
        styles.Divider,
        (emphasis === true || emphasis === 'strong') && styles.emphasized,
        emphasis === 'subdued' && styles.subdued,
        (padding === true || padding === 'base') && styles.paddingBase,
      )}
    />
  );
}
