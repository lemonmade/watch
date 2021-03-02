import {
  createContext,
  useState,
  useRef,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import type {PropsWithChildren} from 'react';

import {ImplicitActionContext} from '../../utilities/actions';
import type {Action} from '../../utilities/actions';
import {useUniqueId} from '../../utilities/id';
import {useGlobalEvents} from '../../utilities/global-events';

import styles from './Popover.css';

const PopoverActiveContext = createContext(false);

interface PopoverSheetController {
  prepare(id: string): Promise<void>;
  open(id: string): Promise<void>;
  close(id: string): Promise<void>;
  update(geometry: any): void;
  measure(): any;
  contains(element: HTMLElement): boolean;
}

interface PopoverTriggerController {
  measure(): any;
  contains(element: HTMLElement): boolean;
}

interface PopoverController {
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

interface PopoverProps {
  controlledBy?: string;
}

export function Popover({
  children,
  controlledBy,
}: PropsWithChildren<PopoverProps>) {
  const id = useUniqueId('Popover');
  const globalEvents = useGlobalEvents();
  const controller = useMemo(() => createPopoverController(id, globalEvents), [
    id,
    globalEvents,
  ]);
  const active = usePopoverActive(controller);

  const implicitAction = useMemo<Action>(() => {
    return {
      id: controlledBy,
      perform: () => controller.set(!controller.active),
      target: {
        id,
        type: 'popover',
        active,
      },
    };
  }, [controller, controlledBy, id, active]);

  return (
    <PopoverActiveContext.Provider value={active}>
      <PopoverControllerContext.Provider value={controller}>
        <ImplicitActionContext action={implicitAction}>
          <PopoverTrigger>{children}</PopoverTrigger>
        </ImplicitActionContext>
      </PopoverControllerContext.Provider>
    </PopoverActiveContext.Provider>
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
    <div ref={ref} className={styles.PopoverTrigger}>
      {children}
    </div>
  );
}

interface PopoverSheetProps {}

export function PopoverSheet({children}: PropsWithChildren<PopoverSheetProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const controller = usePopoverController();
  const [rendered, setRendered] = useState(false);

  const helpers = useRef<any>({});

  useEffect(() => {
    const setState = (state: string) => {
      if (ref.current) {
        ref.current.dataset.state = state;
      }
    };

    const unlisten = controller.subscribe(() => {
      switch (controller.state) {
        case 'preparing': {
          setRendered(true);
          break;
        }
        case 'inactive': {
          setRendered(false);
          break;
        }
        case 'open': {
          setState('open');
          break;
        }
      }
    });

    const clearSheet = controller.setSheet({
      measure() {
        const {current: sheet} = ref;

        if (sheet == null) {
          throw new Error('No sheet!');
        }

        return {
          x: sheet.offsetLeft,
          y: sheet.offsetTop,
          inline: sheet.offsetWidth,
          block: sheet.offsetHeight,
        };
      },
      contains(element) {
        return (
          (ref.current === element || ref.current?.contains(element)) ?? false
        );
      },
      update(geometry) {
        const {current: sheet} = ref;

        if (sheet == null) {
          return;
        }

        // eslint-disable-next-line no-warning-comments
        // TODO (CS): Need an "implicit sheet" to be relative to, for modals/ sheets in sheets
        // const windowWidth = window.innerWidth;

        // const relativePosition =
        //   (geometry.trigger.left + geometry.trigger.width / 2) /
        //   window.innerWidth;

        const startPosition =
          geometry.trigger.left +
          geometry.trigger.width / 2 -
          geometry.sheet.inline / 2;

        sheet.style.left = `${startPosition}px`;
        sheet.style.top = `${geometry.trigger.top + geometry.trigger.height}px`;
      },
      async prepare() {
        await new Promise<void>((resolve) => {
          helpers.current.onRenderChange = (rendered: boolean) => {
            if (!rendered) return;
            delete helpers.current.onRenderChange;
            resolve();
          };
        });
      },
      async open() {
        const transitionEnd = onTransitionEnd(ref.current);
        setState('opening');
        await transitionEnd;
      },
      async close() {
        const transitionEnd = onTransitionEnd(ref.current);
        setState('closing');
        await transitionEnd;
      },
    });

    return () => {
      unlisten();
      clearSheet();
    };
  }, [controller]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      helpers.current.onRenderChange?.(rendered);
    }, 10);

    return () => {
      window.clearTimeout(handle);
    };
  }, [rendered]);

  return rendered ? (
    <ImplicitActionContext action={undefined}>
      <div
        className={styles.PopoverSheet}
        id={controller.id}
        ref={ref}
        data-state="inactive"
      >
        {children}
      </div>
    </ImplicitActionContext>
  ) : null;
}

function onTransitionEnd(element: HTMLElement | null): Promise<void> {
  if (element == null) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const listener = (event: TransitionEvent) => {
      if (event.target !== element || event.propertyName !== 'transform') {
        return;
      }

      element.removeEventListener('transitionend', listener);
      resolve();
    };

    element.addEventListener('transitionend', listener);
  });
}

function usePopoverController() {
  const controller = useContext(PopoverControllerContext);

  if (controller == null) {
    throw new Error('No popover controller found!');
  }

  return controller;
}
