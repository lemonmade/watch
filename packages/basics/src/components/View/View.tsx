import {PropsWithChildren, CSSProperties, ComponentProps} from 'react';
import {classes, variation} from '@lemon/css';
import styles from './View.css';

interface Position {
  type: 'relative' | 'absolute';
  block?: 'start' | 'center' | 'end';
  inline?: 'start' | 'center' | 'end';
}

interface Props {
  position?: Position | Position['type'];
  padding?: number;
  border?: string;
  background?: string;
  cornerRadius?: number | 'concentric';
  accessibility?: 'hidden';
  accessibilityRole?: 'section';
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
  cornerRadius,
  padding,
  background,
  accessibility,
  accessibilityRole,
}: PropsWithChildren<Props>) {
  const Element = accessibilityRole === 'section' ? 'section' : 'div';
  const style: CSSProperties = {
    border,
    backgroundColor: background,
  };

  const moreProps: ComponentProps<'div'> = {};

  // concentric border radius is handled with a class
  if (typeof cornerRadius === 'number') {
    const radius = relativeSize(cornerRadius);
    (style as any)[`--z-container-corner-radius`] = radius;
    style.borderRadius = radius;
  }

  if (padding) {
    const relativePadding = relativeSize(padding);
    (style as any)['--z-container-inset'] = relativePadding;
    style.padding = relativePadding;
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

  if (accessibility === 'hidden') {
    moreProps['aria-hidden'] = true;
  }

  return (
    <Element
      style={style}
      className={classes(
        styles.View,
        cornerRadius === 'concentric' &&
          styles[variation('cornerRadius', cornerRadius)],
      )}
      {...moreProps}
    >
      {children}
    </Element>
  );
}

function relativeSize(points: number) {
  return `${points / 16}rem`;
}
