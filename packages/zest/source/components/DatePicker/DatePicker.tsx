import {useMemo, type ReactNode} from 'react';
import {
  isToday,
  isYesterday,
  startOfToday,
  startOfYesterday,
  previousDay,
  subDays,
  subMonths,
  differenceInCalendarDays,
  isSameDay,
} from 'date-fns';

import {Action} from '../Action';
import {Popover} from '../Popover';
import {Menu} from '../Menu';
import {Text} from '../Text';
import {TextField} from '../TextField';

import styles from './DatePicker.module.css';
import {View} from '../View';
import {useComputed, useSignal} from '@watching/react-signals';

interface Props {
  id?: string;
  label: ReactNode;
  value?: Date;
  onChange(value: Date | undefined): void;
}

export function DatePicker({id, label, value, onChange}: Props) {
  const content =
    value == null ? (
      <Text emphasis="subdued">{label}</Text>
    ) : (
      <Text>
        <Text emphasis="subdued">{label}</Text> <DatePickerLabel date={value} />
      </Text>
    );

  return (
    <Action
      id={id}
      popover={<DatePickerPopover onChange={onChange} />}
      accessory={
        value == null ? undefined : (
          <Action
            icon="delete"
            accessibilityLabel="Clear date"
            onPress={() => onChange(undefined)}
          />
        )
      }
    >
      {content}
    </Action>
  );
}

function DatePickerLabel({date}: {date: Date}) {
  const content = useMemo(() => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (differenceInCalendarDays(Date.now(), date) < 7) {
      return weekdayDetails(date.getDay()).label;
    }

    return shortDate(date, {weekday: true});
  }, [date]);

  return <Text emphasis>{content}</Text>;
}

function DatePickerPopover({
  onChange,
}: {
  onChange(value: Date | undefined): void;
}) {
  const dateSearch = useSignal('');
  const dateSuggestions = useComputed(() =>
    dateSuggestionsForSearch(dateSearch.value.trim()),
  );

  const currentDateSearch = dateSearch.value.trim();

  const menuItems =
    currentDateSearch === '' ? (
      <>
        <Action icon="date" onPress={() => onChange(startOfToday())}>
          Today
        </Action>
        <Action icon="date" onPress={() => onChange(startOfYesterday())}>
          Yesterday
        </Action>
      </>
    ) : (
      dateSuggestions.value.map(({date, label, detail}) => {
        return (
          <Action
            key={label}
            icon="date"
            onPress={() => onChange(date)}
            detail={<Text emphasis="subdued">{detail}</Text>}
          >
            {label}
          </Action>
        );
      })
    );

  return (
    <Popover>
      <View className={styles.DatePicker}>
        <View padding="small" paddingBlockEnd={false}>
          <TextField
            label="Date"
            labelStyle="placeholder"
            value={dateSearch.value}
            onInput={(newValue) => {
              dateSearch.value = newValue;
            }}
          />
        </View>
        <Menu>{menuItems}</Menu>
      </View>
    </Popover>
  );
}

interface DateSuggestion {
  label: string;
  detail: string;
  date: Date;
}

const KEYWORD_TODAY = 'today';
const KEYWORD_YESTERDAY = 'yesterday';
const STARTS_WITH_DAYS = /^\d{1,2}($|\s)/;

function dateSuggestionsForSearch(search: string): DateSuggestion[] {
  const suggestions: DateSuggestion[] = [];

  if (search === '') return suggestions;

  const today = startOfToday();
  const normalizedSearch = search.toLowerCase();

  if (KEYWORD_TODAY.startsWith(normalizedSearch)) {
    suggestions.push({
      date: today,
      label: 'Today',
      detail: shortDate(today),
    });
  }

  if (KEYWORD_YESTERDAY.startsWith(normalizedSearch)) {
    const date = startOfYesterday();

    suggestions.push({
      date,
      label: 'Yesterday',
      detail: shortDate(date),
    });
  }

  const weekdayMatches: WeekdayDetails[] = [];

  for (let weekday = 0; weekday < 7; weekday++) {
    const details = weekdayDetails(weekday);

    if (details.label.toLocaleLowerCase().startsWith(normalizedSearch)) {
      weekdayMatches.push(details);
    }
  }

  if (suggestions.length === 0 && weekdayMatches.length === 1) {
    const details = weekdayMatches[0]!;
    const weekBefore = previousDay(details.previous, details.day);
    const twoWeeksBefore = previousDay(weekBefore, details.day);

    suggestions.push(
      weekdaySuggestion(details.previous),
      weekdaySuggestion(weekBefore),
      weekdaySuggestion(twoWeeksBefore),
    );
  } else {
    for (const details of weekdayMatches.sort(
      (weekdayOne, weekdayTwo) =>
        weekdayTwo.previous.getTime() - weekdayOne.previous.getTime(),
    )) {
      suggestions.push(weekdaySuggestion(details.previous));
    }
  }

  if (suggestions.length > 0) return suggestions;

  const matched = normalizedSearch.match(STARTS_WITH_DAYS)?.[0];

  if (matched == null) return suggestions;

  const parsed = Number.parseInt(matched.trim(), 10);

  const monthAtParsedDay = new Date(today);
  monthAtParsedDay.setDate(parsed);

  if (
    parsed < today.getDate() &&
    monthAtParsedDay.getMonth() === today.getMonth()
  ) {
    suggestions.push({
      date: monthAtParsedDay,
      label: shortDate(monthAtParsedDay, {month: 'long'}),
      detail: weekdayDetails(monthAtParsedDay.getDay()).label,
    });
  } else {
    const monthAgo = subMonths(monthAtParsedDay, 1);

    if (monthAgo.getMonth() < today.getMonth()) {
      suggestions.push({
        date: monthAgo,
        label: shortDate(monthAgo, {month: 'long'}),
        detail: weekdayDetails(monthAgo.getDay()).label,
      });
    }
  }

  const todayMinusDays = subDays(today, parsed);

  if (
    suggestions.length === 0 ||
    !isSameDay(todayMinusDays, suggestions[0]!.date)
  ) {
    suggestions.push({
      date: todayMinusDays,
      label: daysAgo(todayMinusDays),
      detail:
        differenceInCalendarDays(today, todayMinusDays) < 7
          ? weekdayDetails(todayMinusDays.getDay()).label
          : shortDate(todayMinusDays, {weekday: true}),
    });
  }

  return suggestions;
}

interface WeekdayDetails {
  day: number;
  previous: Date;
  label: string;
}

const WEEKDAY_CACHE = new Map<number, WeekdayDetails>();

function weekdayDetails(weekday: number) {
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

function weekdaySuggestion(date: Date): DateSuggestion {
  return {
    date,
    label:
      differenceInCalendarDays(Date.now(), date) < 7
        ? weekdayDetails(date.getDay()).label
        : shortDate(date, {weekday: true}),
    detail: daysAgo(date),
  };
}

function shortDate(
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

function daysAgo(date: Date) {
  const difference = differenceInCalendarDays(Date.now(), date);
  return difference === 1 ? `1 day ago` : `${difference} days ago`;
}
