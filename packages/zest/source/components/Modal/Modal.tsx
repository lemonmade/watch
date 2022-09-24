import {useRef, useEffect, type PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import {
  OverlayContextReset,
  useOverlayController,
} from '../../utilities/overlays';
import {ConnectedAccessoryReset} from '../../utilities/actions';
import {useCanvas, type Canvas} from '../../utilities/canvas';
import {StackedLayer} from '../../utilities/layers';
import {AutoHeadingContext} from '../../utilities/headings';

import systemStyles from '../../system.module.css';

import {Portal} from '../Portal';

import styles from './Modal.module.css';

interface ModalProps {
  padding?: boolean;
}

export function Modal({children, padding}: PropsWithChildren<ModalProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const canvas = useCanvas();
  const overlay = useOverlayController();

  return overlay.state.value === 'open' ? (
    <>
      <LockCanvas canvas={canvas} />
      <OverlayContextReset>
        <ConnectedAccessoryReset>
          <AutoHeadingContext.Provider value={2}>
            <Portal>
              <StackedLayer>
                <div
                  className={classes(
                    systemStyles.resetOrientation,
                    styles.Modal,
                    styles.active,
                    padding && styles.padding,
                  )}
                  id={overlay.id}
                  ref={ref}
                >
                  {children}
                </div>
              </StackedLayer>
              <div className={styles.Backdrop} onPointerDown={overlay.close} />
            </Portal>
          </AutoHeadingContext.Provider>
        </ConnectedAccessoryReset>
      </OverlayContextReset>
    </>
  ) : null;
}

function LockCanvas({canvas}: {canvas: Canvas}) {
  useEffect(() => {
    canvas.inert.value = true;
    canvas.scroll.value = 'locked';

    return () => {
      canvas.inert.value = false;
      canvas.scroll.value = 'auto';
    };
  }, [canvas]);

  return null;
}
