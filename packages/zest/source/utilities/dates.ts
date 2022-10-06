import {differenceInCalendarDays, previousDay} from 'date-fns';

export interface WeekdayDetails {
  day: number;
  previous: Date;
  label: string;
}

const WEEKDAY_CACHE = new Map<number, WeekdayDetails>();

export function weekdayDetails(weekday: number) {
  if (WEEKDAY_CACHE.has(weekday)) {
    return WEEKDAY_CACHE.get(weekday)!;
  }

  const previous = previousDay(Date.now(), weekday);

  const label = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
  }).format(previous);

  const details: WeekdayDetails = {
    day: weekday,
    previous,
    label,
  };

  WEEKDAY_CACHE.set(weekday, details);

  return details;
}

export function prettyDate(date: Date) {
  const differenceInDays = differenceInCalendarDays(Date.now(), date);

  return differenceInDays === 0
    ? 'Today'
    : differenceInDays === 1
    ? 'Yesterday'
    : differenceInDays < 7
    ? weekdayDetails(date.getDay()).label
    : differenceInDays < 30
    ? shortDate(date, {weekday: true})
    : new Intl.DateTimeFormat(undefined, {
        month: 'long',
        day: 'numeric',
        year: differenceInDays < 365 ? undefined : 'numeric',
      }).format(date);
}

export function shortDate(
  date: Date,
  {
    weekday = false,
    month = 'short',
  }: {weekday?: boolean; month?: 'short' | 'long'} = {},
) {
  return new Intl.DateTimeFormat(undefined, {
    month,
    day: 'numeric',
    weekday: weekday ? 'short' : undefined,
  }).format(date);
}
