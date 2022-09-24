import {useEffect, useMemo} from 'react';
import type {PropsWithChildren} from 'react';
import {signal, effect} from '@preact/signals-core';

import {CanvasContext, type Canvas as CanvasType} from '../../utilities/canvas';
import {RootLayer} from '../../utilities/layers';
import {UniqueIdContext, UniqueIdFactory} from '../../utilities/id';
import {AutoHeadingContext} from '../../utilities/headings';

import systemStyles from '../../system.module.css';

import '../../style.css';
import './Canvas.module.css';

interface Props {}

export function Canvas({children}: PropsWithChildren<Props>) {
  const {canvas, idFactory} = useMemo(() => {
    const canvas: CanvasType = {
      level: 0,
      scroll: signal('auto'),
      inert: signal(false),
      portal: {
        container: signal(null),
      },
    };

    return {canvas, idFactory: new UniqueIdFactory()};
  }, []);

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
    <UniqueIdContext.Provider value={idFactory}>
      <AutoHeadingContext.Provider value={1}>
        <CanvasContext.Provider value={canvas}>
          <RootLayer layer={canvas}>{children}</RootLayer>
          <div
            ref={(element) => {
              canvas.portal.container.value = element;
            }}
          />
        </CanvasContext.Provider>
      </AutoHeadingContext.Provider>
    </UniqueIdContext.Provider>
  );
}
