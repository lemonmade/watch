export interface Props {
  source: 'arrowEnd';
}

export function Icon({source}: Props) {
  switch (source) {
    case 'arrowEnd':
      return <span aria-hidden>→</span>;
    default:
      return null;
  }
}
