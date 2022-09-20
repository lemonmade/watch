import {useEffect, useMemo} from 'react';
import type {PropsWithChildren} from 'react';
import {signal, effect} from '@preact/signals-core';

import {CanvasContext, type Canvas as CanvasType} from '../../utilities/canvas';
import {UniqueIdContext, UniqueIdFactory} from '../../utilities/id';
import {AutoHeadingContext} from '../../utilities/headings';

import '../../style.css';
import styles from './Canvas.module.css';

interface Props {}

export function Canvas({children}: PropsWithChildren<Props>) {
  const {canvas, idFactory} = useMemo(() => {
    const canvas: CanvasType = {
      locked: signal(false),
      portal: {
        container: signal(null),
      },
    };

    return {canvas, idFactory: new UniqueIdFactory()};
  }, []);

  return (
    <UniqueIdContext.Provider value={idFactory}>
      <AutoHeadingContext.Provider value={1}>
        <CanvasProvider canvas={canvas}>{children}</CanvasProvider>
      </AutoHeadingContext.Provider>
    </UniqueIdContext.Provider>
  );
}

function CanvasProvider({
  canvas,
  children,
}: PropsWithChildren<{canvas: CanvasType}>) {
  useEffect(
    () =>
      effect(() => {
        if (canvas.locked.value) {
          document.body.classList.add(styles.locked!);
        } else {
          document.body.classList.remove(styles.locked!);
        }
      }),
    [canvas],
  );

  return (
    <CanvasContext.Provider value={canvas}>
      {children}
      <div
        ref={(element) => {
          canvas.portal.container.value = element;
        }}
      />
    </CanvasContext.Provider>
  );
}
