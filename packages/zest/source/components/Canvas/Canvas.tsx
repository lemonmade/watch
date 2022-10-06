import {useEffect, useMemo} from 'react';
import type {PropsWithChildren} from 'react';
import {signal, effect} from '@preact/signals-core';

import {CanvasContext, type Canvas as CanvasType} from '../../utilities/canvas';
import {RootLayer} from '../../utilities/layers';
import {UniqueIdContext, UniqueIdFactory} from '../../utilities/id';
import {createActionScope} from '../../utilities/actions';

import systemStyles from '../../system.module.css';

import '../../style.css';
import styles from './Canvas.module.css';

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

    return {
      canvas,
      idFactory: new UniqueIdFactory(),
      actionScope: createActionScope({id: 'Canvas'}),
    };
  }, []);

  useEffect(() => {
    const portals = document.createElement('div');
    portals.classList.add(styles.Portals!);
    document.body.append(portals);
    canvas.portal.container.value = portals;

    const teardown = effect(() => {
      if (canvas.scroll.value === 'locked') {
        document.body.classList.add(systemStyles.scrollLock!);
      } else {
        document.body.classList.remove(systemStyles.scrollLock!);

        if (document.body.classList.length === 0) {
          document.body.removeAttribute('class');
        }
      }
    });

    return () => {
      teardown();

      portals.remove();

      if (canvas.portal.container.value === portals) {
        canvas.portal.container.value = null;
      }
    };
  }, [canvas]);

  return (
    <UniqueIdContext.Provider value={idFactory}>
      <CanvasContext.Provider value={canvas}>
        <RootLayer layer={canvas}>{children}</RootLayer>
      </CanvasContext.Provider>
    </UniqueIdContext.Provider>
  );
}
