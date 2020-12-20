import React, {PropsWithChildren, CSSProperties} from 'react';
import {classes, variation} from '@lemon/css';
import styles from './View.css';

interface Props {
  padding?: number;
  background?: string;
  cornerRadius?: number | 'concentric';
}

export function View({
  children,
  cornerRadius,
  padding,
  background,
}: PropsWithChildren<Props>) {
  const style: CSSProperties = {
    backgroundColor: background,
  };

  // concentric border radius is handled with a class
  if (typeof cornerRadius === 'number') {
    const radius = relativeSize(cornerRadius);
    (style as any)[`--x-container-corner-radius`] = radius;
    style.borderRadius = radius;
  }

  if (padding) {
    const relativePadding = relativeSize(padding);
    (style as any)['--x-container-inset'] = relativePadding;
    style.padding = relativePadding;
  }

  return (
    <div
      style={style}
      className={classes(
        styles.View,
        cornerRadius === 'concentric' &&
          styles[variation('cornerRadius', cornerRadius)],
      )}
    >
      {children}
    </div>
  );
}

function relativeSize(points: number) {
  return `${points / 16}rem`;
}
