import {classes} from '@lemon/css';

import {Icon} from '../Icon/Icon.tsx';
import {Text} from '../Text/Text.tsx';

import styles from './Poster.module.css';

export interface PosterProps {
  source?: string | null;
  label?: string;
}

export function Poster({source, label}: PosterProps) {
  const isPlaceholder = !source;

  return (
    <div
      role={label == null ? 'presentation' : undefined}
      className={classes(styles.Poster, isPlaceholder && styles.placeholder)}
    >
      {isPlaceholder ? (
        <div className={styles.PlaceholderContent}>
          <div className={styles.Icon}>
            <Icon emphasis="subdued" size="fill" source="tv" />
          </div>
          {label && <Text emphasis="subdued">{label}</Text>}
        </div>
      ) : (
        <img className={styles.Image} src={source} alt={label ?? ''} />
      )}
    </div>
  );
}
