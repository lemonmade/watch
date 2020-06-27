import React, {
  useRef,
  useState,
  KeyboardEventHandler,
  PointerEventHandler,
  memo,
  useCallback,
} from 'react';
import {classes} from '@lemon/css';
import styles from './Rating.css';

interface Props {
  value?: number;
  onChange?(value: number): void;
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

export const Rating = memo(function Rating({value, onChange}: Props) {
  const starContainer = useRef<null | HTMLDivElement>(null);
  const [inProgressValue, setInProgressValue] = useState<number | undefined>(
    undefined,
  );

  const valueRef = useRef(value);
  valueRef.current = value;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const inProgressValueRef = useRef(0);

  const updateValue = (newValue: number) => {
    if (valueRef.current !== newValue && onChangeRef.current != null) {
      onChangeRef.current(newValue);
    }
  };

  const updateValueBySteps = (steps: number) =>
    updateValue(Math.max(0, Math.min(100, (value || 0) + steps * 10)));

  const handleKeyPress: KeyboardEventHandler<HTMLDivElement> = ({
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

  const handlePointerDown = useCallback<PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (starContainer.current == null) {
        return;
      }

      const {
        left: containerLeft,
        width: containerWidth,
      } = starContainer.current.getBoundingClientRect();

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

        setInProgressValue(nearestTen);
        inProgressValueRef.current = nearestTen;
      };

      const finish = () => {
        updateValue(inProgressValueRef.current);
        setInProgressValue(undefined);

        document.removeEventListener('pointerup', finish);
        document.removeEventListener('pointercancel', finish);
        document.removeEventListener('pointermove', handleEvent);
      };

      handleEvent(event);

      document.addEventListener('pointerup', finish);
      document.addEventListener('pointercancel', finish);
      document.addEventListener('pointermove', handleEvent);
    },
    [],
  );

  return (
    <div
      className={styles.Rating}
      tabIndex={0}
      role="slider"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={value}
      onKeyDown={handleKeyPress}
      onPointerDown={handlePointerDown}
    >
      <div className={styles.StarContainer} ref={starContainer}>
        <Star fill={fillForValueInRange(value, inProgressValue, 0, 20)} />
        <Star fill={fillForValueInRange(value, inProgressValue, 20, 40)} />
        <Star fill={fillForValueInRange(value, inProgressValue, 40, 60)} />
        <Star fill={fillForValueInRange(value, inProgressValue, 60, 80)} />
        <Star fill={fillForValueInRange(value, inProgressValue, 80, 100)} />
      </div>
    </div>
  );
});

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

const Star = memo(function Star({fill}: StarProps) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={classes(
        styles.Star,
        fill === StarFill.Full && styles['Star-fillFull'],
        fill === StarFill.Partial && styles['Star-fillPartial'],
        fill === StarFill.FullInverse && styles['Star-fillFullInverse'],
        fill === StarFill.PartialInverse && styles['Star-fillPartialInverse'],
        fill === StarFill.HalfAndHalf && styles['Star-fillHalfAndHalf'],
      )}
    >
      <path
        d="M16 26.2662L7.29927 30.7148C7.0073 30.8859 6.77372 30.943 6.54015 30.943C6.24817 30.943 6.07299 30.8289 5.9562 30.6578C5.83942 30.4867 5.78102 30.2586 5.78102 29.9734C5.78102 29.9163 5.78102 29.7452 5.83942 29.5741L7.47445 20.1635L0.467153 13.4905C0.116788 13.1483 0 12.8631 0 12.5779C0 12.1217 0.350365 11.8365 1.10949 11.7224L10.8029 10.3536L15.1241 1.79848C15.3577 1.28517 15.6496 1 16 1V26.2662Z"
        className={styles.StarPath}
      />
      <path
        d="M16 26.2662L24.7007 30.7148C24.9927 30.8859 25.2263 30.943 25.4599 30.943C25.7518 30.943 25.927 30.8289 26.0438 30.6578C26.1606 30.4867 26.219 30.2586 26.219 29.9734C26.219 29.9163 26.219 29.7452 26.1606 29.5741L24.5255 20.1635L31.5328 13.4905C31.8832 13.1483 32 12.8631 32 12.5779C32 12.1217 31.6496 11.8365 30.8905 11.7224L21.1971 10.3536L16.8759 1.79848C16.6423 1.28517 16.3504 1 16 1V26.2662Z"
        className={styles.StarPath}
      />
    </svg>
  );
});
