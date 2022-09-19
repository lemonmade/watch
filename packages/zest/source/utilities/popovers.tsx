import {
  createContext,
  useState,
  useRef,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
  type PropsWithChildren,
} from 'react';

import styles from '../system.module.css';

import {useUniqueId} from './id';
import {useGlobalEvents} from './global-events';
import {ImplicitActionContext, type ImplicitAction} from './actions';

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

export interface PopoverController {
  readonly id: string;
  readonly activationId: string;
  readonly active: boolean;
  readonly state: 'inactive' | 'preparing' | 'opening' | 'open' | 'closing';
  set(active: boolean): void;
  subscribe(subscriber: () => void): () => void;
  setTrigger(trigger: PopoverTriggerController): () => void;
  setSheet(controller: PopoverSheetController): () => void;
}

const PopoverControllerContext = createContext<PopoverController | null>(null);

interface PopoverContextProps {
  popover: ReactNode | false;
}

export function ImplicitPopoverActivation({
  popover,
  children,
}: PropsWithChildren<PopoverContextProps>) {
  const id = useUniqueId('Popover');
  const globalEvents = useGlobalEvents();
  const controller = useMemo(
    () => createPopoverController(id, globalEvents),
    [id, globalEvents],
  );
  const active = usePopoverActive(controller);

  const implicitAction = useMemo<ImplicitAction>(() => {
    return {
      id,
      type: 'activation',
      perform: () => controller.set(!controller.active),
      target: {
        id,
        type: 'popover',
        active,
      },
    };
  }, [controller, id, active]);

  return (
    <PopoverControllerContext.Provider value={controller}>
      <ImplicitActionContext action={implicitAction}>
        <PopoverTrigger>{children}</PopoverTrigger>
        {popover}
      </ImplicitActionContext>
    </PopoverControllerContext.Provider>
  );
}

function createPopoverController(
  id: string,
  globalEvents: ReturnType<typeof useGlobalEvents>,
) {
  let currentSheet: PopoverSheetController | null = null;
  let currentTrigger: PopoverTriggerController | null = null;
  let activationCount = 0;
  let closing = false;
  let state: PopoverController['state'] = 'inactive';

  const cleanupTasks = new Set<() => void>();
  const subscribers = new Set<() => void>();

  const currentActivationId = () => `Activation${activationCount}`;

  function cleanup() {
    for (const task of cleanupTasks) {
      task();
    }

    cleanupTasks.clear();
  }

  function update() {
    if (
      state === 'inactive' ||
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
    if (state === 'open' || state === 'opening') return;

    activationCount += 1;
    closing = false;

    const stopPointerDownListen = globalEvents.on('pointerdown', (target) => {
      if (currentSheet?.contains(target) || currentTrigger?.contains(target)) {
        return;
      }

      deactivate();
    });

    cleanupTasks.add(() => {
      stopPointerDownListen();
    });

    await setState(state === 'inactive' ? 'preparing' : 'opening');
  }

  async function deactivate() {
    if (state === 'closing' || state === 'inactive') return;

    closing = true;
    cleanup();

    await setState(state === 'preparing' ? 'inactive' : 'closing');
  }

  const setState = (newState: typeof state) => {
    state = newState;

    for (const subscriber of subscribers) {
      subscriber();
    }

    return updateSheet();
  };

  async function updateSheet() {
    if (currentSheet == null) return;

    const activationId = currentActivationId();

    switch (state) {
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

  const isActive = () => state !== 'closing' && state !== 'inactive';

  const controller: PopoverController = {
    id,
    get activationId() {
      return currentActivationId();
    },
    get state() {
      return state;
    },
    get active() {
      return isActive();
    },
    set(active) {
      if (active) {
        activate();
      } else {
        deactivate();
      }
    },
    subscribe(subscriber) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
    setSheet(sheet) {
      const wasActive = isActive();
      currentSheet = sheet;
      state = 'inactive';
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

function usePopoverActive(controller: PopoverController) {
  const [activeState, setActiveState] = useState(() => ({
    id: controller.activationId,
    active: controller.active,
    controller,
  }));

  let active = activeState.active;

  if (controller !== activeState.controller) {
    active = controller.active;
    setActiveState({active, controller, id: controller.activationId});
  }

  useEffect(() => {
    const checkForUpdates = () => {
      setActiveState((currentActiveState) => {
        if (
          currentActiveState.controller !== controller ||
          currentActiveState.id === controller.activationId ||
          currentActiveState.active === controller.active
        ) {
          return currentActiveState;
        }

        return {
          controller,
          id: controller.activationId,
          active: controller.active,
        };
      });
    };

    checkForUpdates();

    return controller.subscribe(checkForUpdates);
  }, [controller]);

  return active;
}

interface PopoverTriggerProps {}

function PopoverTrigger({children}: PropsWithChildren<PopoverTriggerProps>) {
  const controller = usePopoverController();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return controller.setTrigger({
      measure() {
        const {current: trigger} = ref;

        if (trigger == null) {
          throw new Error('no trigger!');
        }

        return trigger.getBoundingClientRect();
      },
      contains(element) {
        return (
          (ref.current === element || ref.current?.contains(element)) ?? false
        );
      },
    });
  }, [controller]);

  return (
    <div ref={ref} className={styles.displayInlineGrid}>
      {children}
    </div>
  );
}

export function usePopoverController() {
  const controller = useContext(PopoverControllerContext);

  if (controller == null) {
    throw new Error('No popover controller found!');
  }

  return controller;
}
