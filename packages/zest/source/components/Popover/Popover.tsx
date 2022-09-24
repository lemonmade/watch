import {useEffect, useRef, type PropsWithChildren, useMemo} from 'react';
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

  return controller.rendered.value ? (
    <ConnectedAccessoryReset>
      <OverlayContextReset>
        <div
          className={classes(
            styles.Popover,
            styles[variation('transition', controller.state.value)],
            styles[variation('blockAttachment', blockAttachment)],
          )}
          id={controller.id}
          ref={(element) => {
            controller.popover.value = element;
          }}
        >
          {children}
        </div>
      </OverlayContextReset>
    </ConnectedAccessoryReset>
  ) : null;
}

type PopoverState =
  | 'preparing'
  | 'openStart'
  | 'openEnd'
  | 'open'
  | 'closeStart'
  | 'closeEnd'
  | 'closed';

interface PopoverController extends Pick<OverlayController, 'id'> {
  readonly state: Signal<PopoverState>;
  readonly rendered: ReadonlySignal<boolean>;
  readonly popover: OverlayController['overlay'];
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
    const canOpen = computed(() => CLOSING_STATES.has(state.value));

    const {trigger, overlay} = overlayController;

    let transitionCount = 0;
    let currentTransition: PopoverTransition | undefined;

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

    function open() {
      if (!canOpen.value) return Promise.resolve(false);

      const abortController = new AbortController();

      const oldTransition = currentTransition;

      transitionCount += 1;
      currentTransition = {
        id: String(transitionCount),
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

      oldTransition?.abort.abort();

      return setState(state.value === 'closed' ? 'preparing' : 'openStart');
    }

    function close() {
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
          update();
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

  const state = useSignalValue(popover.state);

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

  return popover;
}
