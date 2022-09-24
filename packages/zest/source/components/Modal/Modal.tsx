import {useEffect, type PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import {
  OverlayContextReset,
  useOverlayController,
  type OverlayController,
} from '../../utilities/overlays';
import {ConnectedAccessoryReset} from '../../utilities/actions';
import {useCanvas} from '../../utilities/canvas';
import {useLayer} from '../../utilities/layers';
import {AutoHeadingContext} from '../../utilities/headings';

import systemStyles from '../../system.module.css';

import {Portal} from '../Portal';

import styles from './Modal.module.css';

interface ModalProps {
  padding?: boolean;
}

export function Modal({children, padding}: PropsWithChildren<ModalProps>) {
  const overlay = useOverlayController();

  return overlay.state.value === 'open' ? (
    <>
      <LockCanvas />
      <OverlayContextReset>
        <ConnectedAccessoryReset>
          <AutoHeadingContext.Provider value={2}>
            <Portal>
              <ModalSheet overlay={overlay} padding={padding}>
                {children}
              </ModalSheet>
              <ModalBackdrop overlay={overlay} />
            </Portal>
          </AutoHeadingContext.Provider>
        </ConnectedAccessoryReset>
      </OverlayContextReset>
    </>
  ) : null;
}

function ModalSheet({
  overlay,
  padding,
  children,
}: PropsWithChildren<
  Pick<ModalProps, 'padding'> & {overlay: OverlayController}
>) {
  const layer = useLayer();

  return (
    <div
      className={classes(
        systemStyles.resetOrientation,
        styles.Modal,
        styles.active,
        padding && styles.padding,
      )}
      style={{zIndex: (layer.level + 1) * 10}}
      id={overlay.id}
    >
      {children}
    </div>
  );
}

function ModalBackdrop({overlay}: {overlay: OverlayController}) {
  const layer = useLayer();

  return (
    <div
      className={styles.Backdrop}
      style={{zIndex: (layer.level + 1) * 10 - 1}}
      onPointerDown={overlay.close}
    />
  );
}

function LockCanvas() {
  const canvas = useCanvas();

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
