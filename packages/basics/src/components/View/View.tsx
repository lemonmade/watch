import {PropsWithChildren, CSSProperties} from 'react';
import {classes, variation} from '@lemon/css';

import {ViewInternal} from '../ViewInternal';
import type {ViewInternalProps} from '../ViewInternal';

import styles from './View.css';

interface Position {
  type: 'relative' | 'absolute';
  block?: 'start' | 'center' | 'end';
  inline?: 'start' | 'center' | 'end';
}

interface Props
  extends Omit<ViewInternalProps, 'cssStyles' | 'cssClass' | 'cssDisplay'> {
  position?: Position | Position['type'];
  border?: string;
  background?: string;
  cornerRadius?: number | 'concentric';
}

// type Unset = '_';
// type TranslateValue = `${number | Unset}.${number | Unset}`;

// const UNSET: Unset = '_';

// function Translate({inline, block}: {inline?: number, block?: number}): TranslateValue {
//   // TypeScript can’t infer this is correct??
//   return `${inline ?? UNSET}.${block ?? UNSET}` as any;
// }

// function Pixels(value: number) {
//   return value;
// }

// const style = {
//   translate: Translate({inline: Pixels(10)}),
// };

export function View({
  children,
  position,
  border,
  padding,
  cornerRadius,
  background,
  accessibilityRole,
  visibility,
  accessibilityVisibility,
}: PropsWithChildren<Props>) {
  const style: CSSProperties = {
    border,
    backgroundColor: background,
  };

  // concentric border radius is handled with a class
  if (typeof cornerRadius === 'number') {
    const radius = relativeSize(cornerRadius);
    (style as any)[`--z-container-corner-radius`] = radius;
    style.borderRadius = radius;
  }

  if (position) {
    if (typeof position === 'string') {
      style.position = position;
    } else {
      const {type, block, inline} = position;
      style.position = type;

      if (inline) {
        switch (inline) {
          case 'start': {
            style.left = 0;
            break;
          }
          case 'center': {
            style.left = 0;
            style.right = 0;
            style.marginLeft = 'auto';
            style.marginRight = 'auto';
            break;
          }
          case 'end': {
            style.right = 0;
            break;
          }
        }
      }

      if (block) {
        switch (block) {
          case 'start': {
            style.top = 0;
            break;
          }
          case 'center': {
            style.top = 0;
            style.bottom = 0;
            style.marginTop = 'auto';
            style.marginBottom = 'auto';
            break;
          }
          case 'end': {
            style.bottom = 0;
            break;
          }
        }
      }
    }
  }

  return (
    <ViewInternal
      padding={padding}
      accessibilityRole={accessibilityRole}
      visibility={visibility}
      accessibilityVisibility={accessibilityVisibility}
      cssStyles={style}
      cssClass={classes(
        styles.View,
        cornerRadius === 'concentric' &&
          styles[variation('cornerRadius', cornerRadius)],
      )}
    >
      {children}
    </ViewInternal>
  );
}

function relativeSize(points: number) {
  return `${points / 16}rem`;
}
