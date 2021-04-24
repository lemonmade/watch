import {PropsWithChildren} from 'react';

import {useDomProps, toProps} from '../../system';
import type {SystemProps} from '../../system';

import styles from './View.css';

interface Position {
  type: 'relative' | 'absolute';
  block?: 'start' | 'center' | 'end';
  inline?: 'start' | 'center' | 'end';
}

interface Props extends SystemProps {
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
  cornerRadius,
  background,
  ...systemProps
}: PropsWithChildren<Props>) {
  const dom = useDomProps(systemProps);

  dom.addStyles({border, backgroundColor: background});

  // concentric border radius is handled with a class
  if (typeof cornerRadius === 'number') {
    const radius = relativeSize(cornerRadius);
    dom.addStyles({
      '--z-container-corner-radius': radius,
      borderRadius: radius,
    });
  }

  if (position) {
    if (typeof position === 'string') {
      dom.addStyles({position});
    } else {
      const {type, block, inline} = position;
      dom.addStyles({position: type});

      if (inline) {
        switch (inline) {
          case 'start': {
            dom.addStyles({left: 0});
            break;
          }
          case 'center': {
            dom.addStyles({
              left: 0,
              right: 0,
              marginLeft: 'auto',
              marginRight: 'auto',
            });
            break;
          }
          case 'end': {
            dom.addStyles({right: 0});
            break;
          }
        }
      }

      if (block) {
        switch (block) {
          case 'start': {
            dom.addStyles({top: 0});
            break;
          }
          case 'center': {
            dom.addStyles({
              top: 0,
              bottom: 0,
              marginTop: 'auto',
              marginBottom: 'auto',
            });
            break;
          }
          case 'end': {
            dom.addStyles({bottom: 0});
            break;
          }
        }
      }
    }
  }

  if (cornerRadius === 'concentric') {
    dom.addClassName(styles.cornerRadiusConcentric);
  }

  return <div {...toProps(dom)}>{children}</div>;
}

function relativeSize(points: number) {
  return `${points / 16}rem`;
}
