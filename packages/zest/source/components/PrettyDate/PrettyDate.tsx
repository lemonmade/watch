import {useMemo} from 'react';

import {prettyDate} from '../../utilities/dates';

export interface PrettyDateProps {
  date: Date | string;
}

export function PrettyDate({date}: PrettyDateProps) {
  const dateString = typeof date === 'string' ? date : date.toISOString();
  const content = useMemo(() => prettyDate(new Date(dateString)), [dateString]);
  return <>{content}</>;
}
