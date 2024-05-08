import type {RenderableProps} from 'preact';
import {useEffect, useMemo} from 'preact/hooks';
import {signal, effect} from '@preact/signals-core';

import {
  CanvasContext,
  type Canvas as CanvasType,
} from '../../shared/canvas.tsx';
import {RootLayer} from '../../shared/layers.tsx';
import {UniqueIdContext, UniqueIdFactory} from '../../shared/id.ts';
import {createActionScope} from '../../shared/actions.tsx';

import '../../style.css';
import systemStyles from '../../system.module.css';

import styles from './Canvas.module.css';

export interface CanvasProps {}

export function Canvas({children}: RenderableProps<CanvasProps>) {
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
