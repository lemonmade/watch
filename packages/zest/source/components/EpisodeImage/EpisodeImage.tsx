import {classes} from '@lemon/css';

import {Icon} from '../Icon/Icon.tsx';
import {Text} from '../Text/Text.tsx';

import styles from './EpisodeImage.module.css';

export interface EpisodeImageProps {
  source?: string | null;
  label?: string;
}

export function EpisodeImage({source, label}: EpisodeImageProps) {
  const isPlaceholder = !source;

  return (
    <div
      role={label == null ? 'presentation' : undefined}
      className={classes(
        styles.EpisodeImage,
        isPlaceholder && styles.placeholder,
      )}
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
