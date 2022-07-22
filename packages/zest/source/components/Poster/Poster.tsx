import styles from './Poster.module.css';

interface Props {
  source: string;
  accessibilityLabel?: string;
}

export function Poster({source, accessibilityLabel}: Props) {
  return (
    <span
      aria-label={accessibilityLabel}
      role={accessibilityLabel == null ? 'presentation' : undefined}
      style={{backgroundImage: `url(${source})`}}
      className={styles.Poster}
    />
  );
}
