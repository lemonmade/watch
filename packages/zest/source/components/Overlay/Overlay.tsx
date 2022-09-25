import {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type PropsWithChildren,
} from 'react';
import {classes, variation} from '@lemon/css';
import {
  signal,
  computed,
  useSignalValue,
  type Signal,
  type ReadonlySignal,
} from '@watching/react-signals';
import {once} from '@quilted/events';

import {ConnectedAccessoryReset} from '../../utilities/actions';
import {
  OverlayContextReset,
  useOverlayController,
  type OverlayController,
} from '../../utilities/overlays';
import {LockCanvas} from '../../utilities/canvas';
import {useLayer, type Layer} from '../../utilities/layers';
import {useGlobalEventListener} from '../../utilities/global-events';
import {focusFirstFocusable} from '../../utilities/focus';

import {Portal} from '../Portal';

import styles from './Overlay.module.css';

export interface OverlayProps {
  modal?: boolean;
  blockAttachment?: 'start' | 'end';
  inlineAttachment?: 'start' | 'center' | 'end';
  relativeTo?: 'trigger' | 'viewport';
  className?: string | null | false;
  classNameOpenStart?: string | null | false;
  classNameOpenEnd?: string | null | false;
  classNameCloseStart?: string | null | false;
  classNameCloseEnd?: string | null | false;
}

export function Overlay({
  children,
  modal = false,
  relativeTo = 'trigger',
  blockAttachment = 'end',
  inlineAttachment = 'center',
  ...rest
}: PropsWithChildren<OverlayProps>) {
  const overlay = useOverlayTransitionController({
    modal,
    relativeTo,
    blockAttachment,
    inlineAttachment,
  });

  return overlay.rendered.value ? (
    <ConnectedAccessoryReset>
      <OverlayContextReset>
        <Portal>
          <OverlaySheet
            overlay={overlay}
            blockAttachment={blockAttachment}
            inlineAttachment={inlineAttachment}
            {...rest}
          >
            {children}
          </OverlaySheet>
        </Portal>
        {modal && <OverlayBackdrop overlay={overlay} />}
        {modal && <LockCanvas />}
      </OverlayContextReset>
    </ConnectedAccessoryReset>
  ) : null;
}

function OverlaySheet({
  overlay,
  blockAttachment,
  children,
  className,
  classNameOpenStart,
  classNameOpenEnd,
  classNameCloseStart,
  classNameCloseEnd,
}: PropsWithChildren<
  Required<Pick<OverlayProps, 'blockAttachment' | 'inlineAttachment'>> &
    Omit<OverlayProps, 'blockAttachment' | 'inlineAttachment'> & {
      overlay: OverlayTransitionController;
    }
>) {
  const state = overlay.state.value;

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      if (!overlay.modal && overlay.parentLayer.inert.value) {
        return;
      }

      if (
        !(event.target instanceof HTMLElement) ||
        overlay.sheet.value?.contains(event.target) ||
        overlay.trigger.value?.contains(event.target)
      ) {
        return;
      }

      overlay.close();
    },
    [overlay],
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!overlay.modal && overlay.parentLayer.inert.value) {
        return;
      }

      switch ((event as any as KeyboardEvent).key) {
        case 'Escape': {
          overlay.close();
          break;
        }
      }
    },
    [overlay],
  );

  useGlobalEventListener('pointerdown', handlePointerDown as any);
  useGlobalEventListener('keyup', handleKeyUp as any);

  return (
    <div
      className={classes(
        styles.Overlay,
        styles[variation('transition', state)],
        styles[variation('blockAttachment', blockAttachment)],
        className,
        state === 'openStart' && classNameOpenStart,
        state === 'openEnd' && classNameOpenEnd,
        state === 'closeStart' && classNameCloseStart,
        state === 'closeEnd' && classNameCloseEnd,
      )}
      id={overlay.id}
      ref={(element) => {
        overlay.sheet.value = element;
      }}
      style={{zIndex: (overlay.parentLayer.level + 1) * 10}}
    >
      {children}
    </div>
  );
}

function OverlayBackdrop({overlay}: {overlay: OverlayTransitionController}) {
  return (
    <Portal layer={false}>
      <div
        className={classes(
          styles.Backdrop,
          styles[variation('Backdrop-transition', overlay.state.value)],
        )}
        style={{zIndex: (overlay.parentLayer.level + 1) * 10 - 1}}
        onPointerDown={overlay.close}
      />
    </Portal>
  );
}

type PopoverState =
  | 'preparing'
  | 'openStart'
  | 'openEnd'
  | 'open'
  | 'closeStart'
  | 'closeEnd'
  | 'closed';

interface OverlayTransitionController extends Pick<OverlayController, 'id'> {
  readonly modal: boolean;
  readonly state: Signal<PopoverState>;
  readonly rendered: ReadonlySignal<boolean>;
  readonly sheet: OverlayController['overlay'];
  readonly trigger: OverlayController['trigger'];
  readonly parentLayer: Layer;
  open(): Promise<boolean>;
  close(): Promise<boolean>;
}

interface PopoverTransition {
  readonly id: string;
  readonly abort: AbortController;
}

const CLOSING_STATES = new Set<PopoverState>([
  'closeStart',
  'closeEnd',
  'closed',
]);

function useOverlayTransitionController({
  modal,
  relativeTo,
  blockAttachment,
  inlineAttachment,
}: Required<
  Pick<
    OverlayProps,
    'modal' | 'relativeTo' | 'blockAttachment' | 'inlineAttachment'
  >
>) {
  const layer = useLayer();
  const overlayController = useOverlayController();
  const helpers = useRef<any>({});

  const controller = useMemo<
    OverlayTransitionController & {
      start(options?: {signal?: AbortSignal}): void;
    }
  >(() => {
    const state: OverlayTransitionController['state'] = signal('closed');
    const rendered: OverlayTransitionController['rendered'] = computed(
      () => state.value !== 'closed',
    );
    const canOpen = computed(() => CLOSING_STATES.has(state.value));

    const {trigger, overlay} = overlayController;

    let transitionCount = 0;
    let currentTransition: PopoverTransition | undefined;

    return {
      id: overlayController.id,
      modal,
      state,
      rendered,
      sheet: overlayController.overlay,
      trigger: overlayController.trigger,
      open,
      close,
      start,
      parentLayer: layer,
    };

    function start(options?: {signal?: AbortSignal}) {
      overlayController.on(
        'change',
        (open) => {
          if (open) {
            openInternal();
          } else {
            closeInternal();
          }
        },
        options,
      );
    }

    // TODO: wait until actually opened
    async function open() {
      overlayController.open();
      return true;
    }

    async function close() {
      overlayController.close();
      return true;
    }

    function updatePosition() {
      if (relativeTo !== 'trigger') return;

      const currentTrigger = trigger.value;
      const currentOverlay = overlay.value;

      if (
        state.value === 'closed' ||
        currentTrigger == null ||
        currentOverlay == null
      ) {
        return;
      }

      const triggerGeometry = currentTrigger.getBoundingClientRect();
      const overlayGeometry = currentOverlay.getBoundingClientRect();

      let inlineStart: number;
      let blockStart: number;

      switch (inlineAttachment) {
        case 'start': {
          inlineStart = triggerGeometry.left;
          break;
        }
        case 'center': {
          inlineStart =
            triggerGeometry.left +
            triggerGeometry.width / 2 -
            overlayGeometry.width / 2;
          break;
        }
        case 'end': {
          inlineStart =
            triggerGeometry.left +
            triggerGeometry.width -
            overlayGeometry.width;
          break;
        }
      }

      switch (blockAttachment) {
        case 'start': {
          blockStart = triggerGeometry.top - overlayGeometry.height;
          break;
        }
        case 'end': {
          blockStart = triggerGeometry.top + triggerGeometry.height;
          break;
        }
      }

      currentOverlay.style.left = `${inlineStart}px`;
      currentOverlay.style.top = `${blockStart}px`;
    }

    function openInternal() {
      if (!canOpen.value) return Promise.resolve(false);

      const abortController = new AbortController();

      const oldTransition = currentTransition;

      transitionCount += 1;
      currentTransition = {
        id: String(transitionCount),
        abort: abortController,
      };

      oldTransition?.abort.abort();

      return setState(state.value === 'closed' ? 'preparing' : 'openStart');
    }

    function closeInternal() {
      if (canOpen.value) return Promise.resolve(false);
      return setState(state.value === 'preparing' ? 'closed' : 'closeStart');
    }

    async function setState(newState: PopoverState): Promise<boolean> {
      const transition = currentTransition;

      const isActiveTransitionStep = () =>
        transition === currentTransition && state.value === newState;

      switch (newState) {
        case 'preparing': {
          state.value = 'preparing';
          await nextAnimationFrame();
          return isActiveTransitionStep() ? setState('openStart') : false;
        }
        case 'openStart': {
          updatePosition();
          state.value = 'openStart';
          await nextAnimationFrame();
          return isActiveTransitionStep() ? setState('openEnd') : false;
        }
        case 'openEnd': {
          state.value = 'openEnd';
          await nextOverlayTransition();
          return isActiveTransitionStep() ? setState('open') : false;
        }
        case 'closeStart': {
          state.value = 'closeStart';
          await nextAnimationFrame();
          return isActiveTransitionStep() ? setState('closeEnd') : false;
        }
        case 'closeEnd': {
          state.value = 'closeEnd';
          await nextOverlayTransition();
          return isActiveTransitionStep() ? setState('closed') : false;
        }
        case 'open': {
          state.value = 'open';
          focusFirstFocusable(overlayController.overlay.value);
          return true;
        }
        case 'closed': {
          state.value = 'closed';
          focusFirstFocusable(overlayController.trigger.value);
          return true;
        }
        default: {
          state.value = newState;
          return true;
        }
      }
    }

    function nextOverlayTransition() {
      return once(overlay.value!, 'transitionend', {
        signal: currentTransition?.abort.signal,
        abort: 'returns',
      });
    }

    function nextAnimationFrame() {
      return new Promise<void>((resolve) => {
        currentTransition?.abort.signal.addEventListener('abort', () => {
          resolve();
        });

        helpers.current.onStateChange = () => {
          resolve();
        };
      });
    }
  }, [
    layer,
    modal,
    overlayController,
    relativeTo,
    blockAttachment,
    inlineAttachment,
  ]);

  const state = useSignalValue(controller.state);

  useEffect(() => {
    const onStateChange = helpers.current.onStateChange;

    if (!onStateChange) return;

    const handle = window.requestAnimationFrame(() => {
      onStateChange();
      delete helpers.current.onStateChange;
    });

    return () => {
      window.cancelAnimationFrame(handle);
    };
  }, [state]);

  useEffect(() => {
    const abort = new AbortController();
    controller.start({signal: abort.signal});
    return () => abort.abort();
  }, [controller, overlayController]);

  return controller;
}
