import {useRef, useEffect, type PropsWithChildren, useMemo} from 'react';
import {classes, variation} from '@lemon/css';
import {
  signal,
  computed,
  effect,
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
import {useLayer} from '../../utilities/layers';
import {useGlobalEvents} from '../../utilities/global-events';

// import {Portal} from '../Portal';

import styles from './Popover.module.css';

interface PopoverProps {
  blockAttachment?: 'start' | 'end';
  inlineAttachment?: 'start' | 'center' | 'end';
}

export function Popover({
  children,
  blockAttachment = 'end',
  inlineAttachment = 'center',
}: PropsWithChildren<PopoverProps>) {
  const controller = usePopoverController({blockAttachment, inlineAttachment});

  useEffect(
    () =>
      effect(() => {
        const state = controller.state.value;

        const popover = controller.popover.value;

        if (popover) {
          popover.dataset.state = state;
        }
      }),
    [controller],
  );

  return controller.rendered.value ? (
    <ConnectedAccessoryReset>
      <OverlayContextReset>
        <div
          className={classes(
            styles.Popover,
            styles[variation('blockAttachment', blockAttachment)],
          )}
          id={controller.id}
          ref={(element) => {
            controller.popover.value = element;
          }}
          data-state="closed"
        >
          {children}
        </div>
      </OverlayContextReset>
    </ConnectedAccessoryReset>
  ) : null;
}

type PopoverState = 'preparing' | 'opening' | 'open' | 'closing' | 'closed';

interface PopoverController extends Pick<OverlayController, 'id'> {
  readonly state: Signal<PopoverState>;
  readonly rendered: ReadonlySignal<boolean>;
  readonly popover: OverlayController['overlay'];
  open(): Promise<void>;
  close(): Promise<void>;
}

interface PopoverActivation {
  readonly id: string;
  readonly abort: AbortController;
}

function usePopoverController({
  blockAttachment,
  inlineAttachment,
}: Required<Pick<PopoverProps, 'blockAttachment' | 'inlineAttachment'>>) {
  const layer = useLayer();
  const globalEvents = useGlobalEvents();
  const overlayController = useOverlayController();
  const helpers = useRef<any>({});

  const popover = useMemo<PopoverController>(() => {
    const state: PopoverController['state'] = signal('closed');
    const rendered: PopoverController['rendered'] = computed(
      () => state.value !== 'closed',
    );
    const {trigger, overlay} = overlayController;

    let activationCount = 0;
    let currentActivation: PopoverActivation | undefined;

    function update() {
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

      console.log({inlineAttachment, triggerGeometry, overlayGeometry});

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

    async function open() {
      const currentState = state.value;

      if (currentState !== 'closing' && currentState !== 'closed') return;

      const abortController = new AbortController();

      const oldActivation = currentActivation;

      activationCount += 1;
      currentActivation = {
        id: String(activationCount),
        abort: abortController,
      };

      const stopPointerDownListen = globalEvents.on('pointerdown', (target) => {
        if (layer.inert.value) return;

        if (
          overlay.value?.contains(target) ||
          trigger.value?.contains(target)
        ) {
          return;
        }

        overlayController.close();
      });

      abortController.signal.addEventListener('abort', stopPointerDownListen);

      oldActivation?.abort.abort();

      await setState(currentState === 'closed' ? 'preparing' : 'opening');
    }

    async function close() {
      const currentState = state.value;

      if (currentState === 'closing' || currentState === 'closed') return;

      await setState(currentState === 'preparing' ? 'closed' : 'closing');
    }

    async function setState(newState: PopoverState) {
      const activation = currentActivation;

      if (newState === 'preparing') {
        const promise = new Promise<void>((resolve) => {
          helpers.current.onRenderChange = (rendered: boolean) => {
            if (!rendered) return;
            delete helpers.current.onRenderChange;
            resolve();
          };
        });

        state.value = 'preparing';

        await promise;

        if (
          activation?.id !== currentActivation?.id ||
          state.value !== 'preparing'
        ) {
          return;
        }

        await setState('opening');

        return;
      }

      if (!overlay.value) {
        state.value = newState;
        return;
      }

      if (newState === 'opening') {
        update();

        const transitionEnd = once(overlay.value, 'transitionend', {
          signal: activation?.abort.signal,
          abort: 'returns',
        });

        state.value = 'opening';
        await transitionEnd;

        if (
          activation?.id !== currentActivation?.id ||
          state.value !== 'opening'
        ) {
          return;
        }

        await setState('open');

        return;
      }

      if (newState === 'closing') {
        const transitionEnd = once(overlay.value, 'transitionend', {
          signal: activation?.abort.signal,
          abort: 'returns',
        });

        state.value = 'closing';
        await transitionEnd;

        if (
          activation?.id !== currentActivation?.id ||
          state.value !== 'closing'
        ) {
          return;
        }

        await setState('closed');

        return;
      }

      if (newState === 'closed') {
        state.value = newState;
        currentActivation?.abort.abort();
        return;
      }

      state.value = newState;
    }

    return {
      id: overlayController.id,
      state,
      rendered,
      popover: overlayController.overlay,
      open,
      close,
    };
  }, [
    layer,
    globalEvents,
    overlayController,
    blockAttachment,
    inlineAttachment,
  ]);

  useEffect(
    () =>
      overlayController.on('change', (open) => {
        if (open) {
          popover.open();
        } else {
          popover.close();
        }
      }),
    [popover, overlayController],
  );

  const rendered = popover.rendered.value;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      helpers.current.onRenderChange?.(rendered);
    }, 50);

    return () => {
      window.clearTimeout(handle);
    };
  }, [rendered]);

  return popover;
}
