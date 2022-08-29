import styles from './Icon.module.css';

export interface Props {
  source: 'arrowEnd';
}

export function Icon({source}: Props) {
  switch (source) {
    case 'arrowEnd':
      return (
        <span aria-hidden className={styles.Icon}>
          →
        </span>
      );
    default:
      return null;
  }
}
