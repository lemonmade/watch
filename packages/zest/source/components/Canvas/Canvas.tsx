import {useEffect, useMemo} from 'react';
import type {PropsWithChildren} from 'react';
import {signal, effect} from '@preact/signals-core';

import {CanvasContext, type Canvas as CanvasType} from '../../utilities/canvas';
import {LayerContext} from '../../utilities/layers';
import {UniqueIdContext, UniqueIdFactory} from '../../utilities/id';
import {AutoHeadingContext} from '../../utilities/headings';

import systemStyles from '../../system.module.css';

import '../../style.css';
import './Canvas.module.css';

interface Props {}

export function Canvas({children}: PropsWithChildren<Props>) {
  const {canvas, idFactory} = useMemo(() => {
    const canvas: CanvasType = {
      scroll: signal('auto'),
      inert: signal(false),
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
        if (canvas.scroll.value === 'locked') {
          document.body.classList.add(systemStyles.scrollLock!);
        } else {
          document.body.classList.remove(systemStyles.scrollLock!);

          if (document.body.classList.length === 0) {
            document.body.removeAttribute('class');
          }
        }
      }),
    [canvas],
  );

  return (
    <CanvasContext.Provider value={canvas}>
      <LayerContext.Provider value={canvas}>{children}</LayerContext.Provider>
      <div
        ref={(element) => {
          canvas.portal.container.value = element;
        }}
      />
    </CanvasContext.Provider>
  );
}
