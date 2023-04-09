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

import {ConnectedAccessoryReset} from '../../shared/actions.tsx';
import {
  useContainingOverlay,
  type OverlayController,
} from '../../shared/overlays.tsx';
import {LockCanvas} from '../../shared/canvas.tsx';
import {useLayer, type Layer} from '../../shared/layers.tsx';
import {useGlobalEventListener} from '../../shared/global-events.ts';
import {focusFirstFocusable} from '../../shared/focus.ts';

import {Portal} from '../Portal.tsx';

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
  useGlobalEventListener('scroll', overlay.updatePosition);

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
  updatePosition(): void;
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
  const overlayController = useContainingOverlay();
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
    let overlayGeometry: DOMRect;
    let overlayMargins: {inlineStart: number; inlineEnd: number};

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
      updatePosition,
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

    function measureOverlay() {
      if (relativeTo !== 'trigger') return;

      const currentOverlay = overlay.value;
      if (currentOverlay == null) return;

      const overlayStyles = window.getComputedStyle(currentOverlay);

      overlayGeometry = currentOverlay.getBoundingClientRect();
      overlayMargins = {
        inlineStart: Number.parseFloat(overlayStyles.marginLeft || '0'),
        inlineEnd: Number.parseFloat(overlayStyles.marginRight || '0'),
      };
    }

    function updatePosition() {
      if (relativeTo !== 'trigger') return;

      const currentTrigger = trigger.value;
      const currentOverlay = overlay.value;

      if (
        state.value === 'closed' ||
        currentTrigger == null ||
        currentOverlay == null ||
        overlayGeometry == null ||
        overlayMargins == null
      ) {
        return;
      }

      const triggerGeometry = currentTrigger.getBoundingClientRect();
      const viewportGeometry = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let inlineStart: number;
      let blockStart: number;

      const triggerCenter = triggerGeometry.left + triggerGeometry.width / 2;

      switch (inlineAttachment) {
        case 'start': {
          const inlineEndOverflow =
            triggerGeometry.left +
            overlayMargins.inlineEnd +
            overlayGeometry.width -
            viewportGeometry.width;

          if (inlineEndOverflow < 0) {
            inlineStart = triggerGeometry.left - overlayMargins.inlineStart;
          } else if (inlineEndOverflow < overlayGeometry.width / 2) {
            inlineStart =
              triggerGeometry.left -
              overlayMargins.inlineStart -
              inlineEndOverflow;
          } else {
            inlineStart =
              triggerGeometry.left +
              triggerGeometry.width -
              overlayGeometry.width -
              overlayMargins.inlineStart;
          }

          break;
        }
        case 'center': {
          const overlayInlineStart = triggerCenter - overlayGeometry.width / 2;
          const overlayInlineEnd = triggerCenter + overlayGeometry.width / 2;

          if (
            overlayInlineStart <=
            Math.min(overlayMargins.inlineStart, triggerGeometry.left)
          ) {
            inlineStart = triggerGeometry.left - overlayMargins.inlineStart;
          } else if (
            viewportGeometry.width - overlayInlineEnd <=
            Math.min(
              overlayMargins.inlineEnd,
              viewportGeometry.width - triggerGeometry.right,
            )
          ) {
            inlineStart =
              triggerGeometry.left +
              triggerGeometry.width -
              overlayGeometry.width -
              overlayMargins.inlineStart;
          } else {
            inlineStart = overlayInlineStart - overlayMargins.inlineStart;
          }

          break;
        }
        case 'end': {
          const desiredInlineStart =
            triggerGeometry.left +
            triggerGeometry.width -
            overlayGeometry.width -
            overlayMargins.inlineStart;

          if (desiredInlineStart >= 0) {
            inlineStart = desiredInlineStart;
          } else if (-desiredInlineStart < overlayGeometry.width / 2) {
            inlineStart = 0;
          } else {
            inlineStart = triggerGeometry.left - overlayMargins.inlineStart;
          }

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

      const inlineOrigin =
        (triggerCenter - (inlineStart + overlayMargins.inlineStart)) /
        overlayGeometry.width;

      currentOverlay.style.setProperty(
        '--z-internal-Overlay-transform-origin-inline',
        `${inlineOrigin * 100}%`,
      );
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
          if (!isActiveTransitionStep()) return false;

          measureOverlay();
          return setState('openStart');
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
