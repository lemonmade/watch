import {
  createContext,
  useEffect,
  useMemo,
  type RefObject,
  type ReactNode,
  type PropsWithChildren,
} from 'react';
import {signal, computed, type Signal} from '@preact/signals-core';
import {createUseContextHook} from '@quilted/react-utilities';

import {useUniqueId} from './id';
import {useLayer, type Layer} from './layers';
import {useGlobalEvents} from './global-events';
import {ImplicitActionContext, type ImplicitActionActivation} from './actions';

export interface PopoverSheetController {
  prepare(id: string): Promise<void>;
  open(id: string): Promise<void>;
  close(id: string): Promise<void>;
  update(geometry: any): void;
  measure(): any;
  contains(element: HTMLElement): boolean;
}

export interface PopoverTriggerController {
  measure(): any;
  contains(element: HTMLElement): boolean;
}

export type PopoverState =
  | 'inactive'
  | 'preparing'
  | 'opening'
  | 'open'
  | 'closing';

export interface PopoverController {
  readonly id: string;
  readonly activationId: string;
  readonly active: Signal<boolean>;
  readonly state: Signal<PopoverState>;
  set(active: boolean): Promise<void>;
  setTrigger(trigger: PopoverTriggerController): () => void;
  setSheet(sheet: PopoverSheetController): () => void;
}

const PopoverControllerContext = createContext<PopoverController | null>(null);

interface PopoverContextProps {
  target: RefObject<HTMLElement>;
  popover: ReactNode | false;
}

export const usePopoverController = createUseContextHook(
  PopoverControllerContext,
);

export function ImplicitPopoverActivation({
  target,
  popover,
  children,
}: PropsWithChildren<PopoverContextProps>) {
  const id = useUniqueId('Popover');
  const layer = useLayer();
  const globalEvents = useGlobalEvents();
  const controller = useMemo(
    () => createPopoverController(id, layer, globalEvents),
    [id, layer, globalEvents],
  );

  const implicitAction = useMemo<ImplicitActionActivation>(() => {
    return {
      id: controller.id,
      type: 'activation',
      target: {
        id: controller.id,
        type: 'popover',
        active: controller.active,
        async set(active) {
          if (layer.inert.value) return;
          controller.set(active);
        },
      },
    };
  }, [controller, layer]);

  useEffect(() => {
    return controller.setTrigger({
      measure() {
        const targetElement = getElementFromRef(target);

        if (targetElement == null) {
          throw new Error('no trigger!');
        }

        return targetElement.getBoundingClientRect();
      },
      contains(element) {
        const targetElement = getElementFromRef(target);

        return (
          (targetElement === element || targetElement?.contains(element)) ??
          false
        );
      },
    });
  }, [controller, target]);

  return (
    <PopoverControllerContext.Provider value={controller}>
      <ImplicitActionContext action={implicitAction}>
        {children}
        {popover}
      </ImplicitActionContext>
    </PopoverControllerContext.Provider>
  );
}

function createPopoverController(
  id: string,
  layer: Layer,
  globalEvents: ReturnType<typeof useGlobalEvents>,
) {
  let currentSheet: PopoverSheetController | null = null;
  let currentTrigger: PopoverTriggerController | null = null;
  let activationCount = 0;
  let closing = false;

  const state: PopoverController['state'] = signal('inactive');
  const active = computed(() => {
    const currentState = state.value;
    return currentState !== 'closing' && currentState !== 'inactive';
  });

  const cleanupTasks = new Set<() => void>();

  const currentActivationId = () => `Activation${activationCount}`;

  function cleanup() {
    for (const task of cleanupTasks) {
      task();
    }

    cleanupTasks.clear();
  }

  function update() {
    if (
      state.value === 'inactive' ||
      currentSheet == null ||
      currentTrigger == null
    ) {
      return;
    }

    currentSheet.update({
      sheet: currentSheet.measure(),
      trigger: currentTrigger.measure(),
    });
  }

  async function activate() {
    const currentState = state.value;

    if (currentState === 'open' || currentState === 'opening') return;

    activationCount += 1;
    closing = false;

    const stopPointerDownListen = globalEvents.on('pointerdown', (target) => {
      if (layer.inert.value) return;

      if (currentSheet?.contains(target) || currentTrigger?.contains(target)) {
        return;
      }

      deactivate();
    });

    cleanupTasks.add(() => {
      stopPointerDownListen();
    });

    await setState(currentState === 'inactive' ? 'preparing' : 'opening');
  }

  async function deactivate() {
    const currentState = state.value;

    if (currentState === 'closing' || currentState === 'inactive') return;

    closing = true;
    cleanup();

    await setState(currentState === 'preparing' ? 'inactive' : 'closing');
  }

  const setState = (newState: PopoverState) => {
    state.value = newState;
    return updateSheet();
  };

  async function updateSheet() {
    if (currentSheet == null) return;

    const activationId = currentActivationId();

    switch (state.value) {
      case 'preparing': {
        await currentSheet.prepare(activationId);
        if (activationId === currentActivationId() && !closing) {
          await setState('opening');
        }
        break;
      }
      case 'opening': {
        update();
        await currentSheet.open(activationId);
        if (activationId === currentActivationId() && !closing) {
          await setState('open');
        }
        break;
      }
      case 'closing': {
        await currentSheet.close(activationId);
        if (activationId === currentActivationId()) {
          await setState('inactive');
        }
        break;
      }
    }
  }

  const controller: PopoverController = {
    id,
    get activationId() {
      return currentActivationId();
    },
    state,
    active,
    set(active) {
      return active ? activate() : deactivate();
    },
    setSheet(sheet) {
      const wasActive = active.value;
      currentSheet = sheet;
      state.value = 'inactive';

      if (wasActive) activate();

      return () => {
        if (currentSheet === sheet) {
          currentSheet = null;
        }
      };
    },
    setTrigger(trigger) {
      currentTrigger = trigger;
      update();

      return () => {
        if (currentTrigger === trigger) {
          currentTrigger = null;
        }
      };
    },
  };

  return controller;
}

function getElementFromRef(ref: RefObject<HTMLElement>): HTMLElement | null {
  if (ref.current == null) return null;

  // I don't know why, but some of the forwardRef components don’t seem to work correctly,
  // and only forward the component reference, not the HTML element. Those refs store the
  // element in a `base` property.
  if ((ref.current as any).base instanceof HTMLElement) {
    return (ref.current as any).base;
  }

  return ref.current;
}
