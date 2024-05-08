import type {JSX} from 'preact';
import {useRef, useCallback} from 'preact/hooks';
import {classes, variation} from '@lemon/css';
import {
  resolveSignalOrValue,
  useSignal,
  type SignalOrValue,
} from '@quilted/preact-signals';

import styles from './Rating.module.css';

export interface RatingProps {
  value?: SignalOrValue<number | undefined>;
  size?: 'base' | 'large';
  onChange?(value: number | undefined): void;
  readonly?: SignalOrValue<boolean>;
}

enum StarFill {
  None,
  Partial,
  Full,
  PartialInverse,
  FullInverse,
  HalfAndHalf,
}

const PERCENTAGE_TO_PREFER_FILLING = 0.9;

// https://www.w3.org/TR/wai-aria-practices/examples/slider/slider-1.html

export function Rating(props: RatingProps) {
  return resolveSignalOrValue(props.readonly) ? (
    <ReadonlyRating {...props} />
  ) : (
    <EditableRating {...props} />
  );
}

function ReadonlyRating({size, value}: Pick<RatingProps, 'size' | 'value'>) {
  const resolvedValue = resolveSignalOrValue(value);

  return (
    <div
      className={classes(
        styles.Rating,
        size && styles[variation('size', size)],
      )}
    >
      <div className={styles.StarContainer}>
        <Star fill={fillForValueInRange(resolvedValue, resolvedValue, 0, 20)} />
        <Star
          fill={fillForValueInRange(resolvedValue, resolvedValue, 20, 40)}
        />
        <Star
          fill={fillForValueInRange(resolvedValue, resolvedValue, 40, 60)}
        />
        <Star
          fill={fillForValueInRange(resolvedValue, resolvedValue, 60, 80)}
        />
        <Star
          fill={fillForValueInRange(resolvedValue, resolvedValue, 80, 100)}
        />
      </div>
    </div>
  );
}

export function EditableRating({size, value, onChange}: RatingProps) {
  const starContainer = useRef<null | HTMLDivElement>(null);
  const resolvedValue = resolveSignalOrValue(value);
  const inProgressValue = useSignal<number | undefined>(undefined);

  const valueRef = useRef(resolvedValue);
  valueRef.current = resolvedValue;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const inProgressValueRef = useRef(0);

  const updateValue = (newValue: number) => {
    if (valueRef.current !== newValue && onChangeRef.current != null) {
      onChangeRef.current(newValue);
    }
  };

  const updateValueBySteps = (steps: number) =>
    updateValue(Math.max(0, Math.min(100, (resolvedValue ?? 0) + steps * 10)));

  const handleKeyPress: JSX.KeyboardEventHandler<HTMLDivElement> = ({
    key,
    shiftKey,
  }) => {
    const multiplier = shiftKey ? 2 : 1;

    switch (key) {
      case 'ArrowRight':
      case 'ArrowUp':
        updateValueBySteps(Number(multiplier));
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        updateValueBySteps(-1 * multiplier);
        break;
      case 'Home':
        updateValue(0);
        break;
      case 'End':
        updateValue(100);
        break;
      default: {
        if (/^\d$/.test(key)) {
          const value = parseInt(key, 10);
          updateValue(value === 0 ? 100 : value * 10);
        }
      }
    }
  };

  const handlePointerDown = useCallback<
    JSX.PointerEventHandler<HTMLDivElement>
  >(
    (event) => {
      if (starContainer.current == null) {
        return;
      }

      const {left: containerLeft, width: containerWidth} =
        starContainer.current.getBoundingClientRect();

      const handleEvent = (
        event: Pick<PointerEvent, 'pageX' | 'preventDefault'>,
      ) => {
        event.preventDefault();

        const positionWithinStars =
          (Math.max(
            Math.min(event.pageX, containerLeft + containerWidth),
            containerLeft,
          ) -
            containerLeft) /
          containerWidth;

        const nearestTen =
          Math.floor(positionWithinStars * 10 + PERCENTAGE_TO_PREFER_FILLING) *
          10;

        inProgressValue.value = nearestTen;
        inProgressValueRef.current = nearestTen;
      };

      const finish = () => {
        updateValue(inProgressValueRef.current);
        inProgressValue.value = undefined;

        document.removeEventListener('pointerup', finish);
        document.removeEventListener('pointercancel', finish);
        document.removeEventListener('pointermove', handleEvent);
      };

      handleEvent(event);

      document.addEventListener('pointerup', finish);
      document.addEventListener('pointercancel', finish);
      document.addEventListener('pointermove', handleEvent);
    },
    [inProgressValue],
  );

  const resolvedInProgressValue = inProgressValue.value;

  return (
    <div
      className={classes(
        styles.Rating,
        styles.interactive,
        size && styles[variation('size', size)],
      )}
      tabIndex={0}
      role="slider"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={resolvedValue}
      onKeyDown={handleKeyPress}
      onPointerDown={handlePointerDown}
    >
      <div className={styles.StarContainer} ref={starContainer}>
        <Star
          fill={fillForValueInRange(
            resolvedValue,
            resolvedInProgressValue,
            0,
            20,
          )}
        />
        <Star
          fill={fillForValueInRange(
            resolvedValue,
            resolvedInProgressValue,
            20,
            40,
          )}
        />
        <Star
          fill={fillForValueInRange(
            resolvedValue,
            resolvedInProgressValue,
            40,
            60,
          )}
        />
        <Star
          fill={fillForValueInRange(
            resolvedValue,
            resolvedInProgressValue,
            60,
            80,
          )}
        />
        <Star
          fill={fillForValueInRange(
            resolvedValue,
            resolvedInProgressValue,
            80,
            100,
          )}
        />
      </div>
    </div>
  );
}

function fillForValueInRange(
  currentValue: number | undefined,
  inProgressValue: number | undefined,
  start: number,
  end: number,
) {
  const value = currentValue ?? 0;
  const toValue = inProgressValue ?? 0;
  const largerValue = Math.max(value, toValue);
  const increasing =
    inProgressValue == null ||
    inProgressValue >= value ||
    inProgressValue >= end;
  const largerFill =
    largerValue >= end
      ? StarFill.Full
      : largerValue > start
        ? StarFill.Partial
        : StarFill.None;

  if (increasing) {
    return largerFill;
  }

  if (toValue <= start) {
    switch (largerFill) {
      case StarFill.Full:
        return StarFill.FullInverse;
      case StarFill.Partial:
        return StarFill.PartialInverse;
      default:
        return StarFill.None;
    }
  }

  // Only one possibilities left: was full, now half
  return StarFill.HalfAndHalf;
}

interface StarProps {
  fill: StarFill;
}

function Star({fill}: StarProps) {
  return (
    <span
      className={classes(
        styles.Star,
        fill === StarFill.Full && styles['Star-fillFull'],
        fill === StarFill.Partial && styles['Star-fillPartial'],
        fill === StarFill.FullInverse && styles['Star-fillFullInverse'],
        fill === StarFill.PartialInverse && styles['Star-fillPartialInverse'],
        fill === StarFill.HalfAndHalf && styles['Star-fillHalfAndHalf'],
        fill === StarFill.None && styles['Star-none'],
      )}
    >
      <StarIcon />
      <StarIcon />
    </span>
  );
}

function StarIcon() {
  return (
    <span className={styles.StarIcon}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.29927 30.7714L16 26.3143L24.7007 30.7714C24.9927 30.9428 25.2263 31 25.4599 31C25.7518 31 25.927 30.8857 26.0438 30.7143C26.1606 30.5428 26.219 30.3143 26.219 30.0286C26.219 29.9713 26.219 29.7999 26.1606 29.6285L24.5255 20.2L31.5328 13.5143C31.8832 13.1714 32 12.8857 32 12.5999C32 12.1429 31.6496 11.8571 30.8905 11.7428L21.1971 10.3714L16.8759 1.8C16.6423 1.28571 16.3504 1 16 1C15.6496 1 15.3577 1.28571 15.1241 1.8L10.8029 10.3714L1.10949 11.7428C0.350365 11.8571 0 12.1429 0 12.5999C0 12.8857 0.116788 13.1714 0.467153 13.5143L7.47445 20.2L5.83942 29.6285C5.78102 29.7999 5.78102 29.9713 5.78102 30.0286C5.78102 30.3143 5.83942 30.5428 5.9562 30.7143C6.07299 30.8857 6.24817 31 6.54015 31C6.77372 31 7.0073 30.9428 7.29927 30.7714Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
