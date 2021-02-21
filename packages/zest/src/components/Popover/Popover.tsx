import {
  createContext,
  useState,
  useRef,
  useContext,
  useEffect,
  RefObject,
  useMemo,
} from 'react';
import type {PropsWithChildren} from 'react';

import {ImplicitActionContext} from '@lemon/basics';
import type {ImplicitAction} from '@lemon/basics';

import {useUniqueId} from '../../utilities/id';

import styles from './Popover.css';

const PopoverActiveContext = createContext(false);
const PopoverIdContext = createContext<string | undefined>(undefined);
const PopoverIgnoreElementsContext = createContext<Set<RefObject<Element>>>(
  new Set(),
);

interface PopoverProps {}

export function Popover({children}: PropsWithChildren<PopoverProps>) {
  const [active, setActive] = useState(false);
  const ignore = useRef<Set<RefObject<Element>>>(new Set());
  const id = useUniqueId('Popover');

  usePressOutside(
    {
      active,
      ignore: (element) => {
        for (const {current: ignoreElement} of ignore.current) {
          if (element === ignoreElement) return true;
        }

        return false;
      },
    },
    () => {
      setActive(false);
    },
  );

  const implicitAction = useMemo<ImplicitAction>(() => {
    return {
      onAction: () => setActive((active) => !active),
      target: {id, active, type: 'popover'},
    };
  }, [id, active]);

  return (
    <PopoverActiveContext.Provider value={active}>
      <PopoverIgnoreElementsContext.Provider value={ignore.current}>
        <PopoverIdContext.Provider value={id}>
          <ImplicitActionContext action={implicitAction}>
            <PopoverTrigger>{children}</PopoverTrigger>
          </ImplicitActionContext>
        </PopoverIdContext.Provider>
      </PopoverIgnoreElementsContext.Provider>
    </PopoverActiveContext.Provider>
  );
}

interface PopoverTriggerProps {}

function PopoverTrigger({children}: PropsWithChildren<PopoverTriggerProps>) {
  const ref = useIgnoreRef<HTMLDivElement>();

  return (
    <div ref={ref} className={styles.PopoverTrigger}>
      {children}
    </div>
  );
}

interface PopoverSheetProps {}

export function PopoverSheet({children}: PropsWithChildren<PopoverSheetProps>) {
  const active = useContext(PopoverActiveContext);
  const ref = useIgnoreRef<HTMLDivElement>();
  const id = useContext(PopoverIdContext);

  return active ? (
    <div className={styles.PopoverSheet} id={id} ref={ref}>
      {children}
    </div>
  ) : null;
}

function useIgnoreRef<T extends HTMLElement>() {
  const ref: RefObject<T> = useRef<T>(null);
  const ignore = useContext(PopoverIgnoreElementsContext);

  useEffect(() => {
    ignore.add(ref);

    return () => {
      ignore.delete(ref);
    };
  }, [ignore]);

  return ref;
}

function usePressOutside(
  {
    active = true,
    ignore = () => false,
  }: {
    active?: boolean;
    ignore?(element: Element): boolean;
  },
  perform: () => void,
) {
  const functionsRef = useRef<[typeof ignore, typeof perform]>(null as any);
  functionsRef.current = [ignore, perform];

  useEffect(() => {
    if (!active) return;

    const listener = ({target}: PointerEvent) => {
      const [ignore, perform] = functionsRef.current;
      let currentElement = target as HTMLElement | null;

      while (currentElement != null) {
        if (ignore(currentElement)) return;
        currentElement = currentElement.parentElement;
      }

      perform();
    };

    document.addEventListener('pointerdown', listener);

    return () => {
      document.removeEventListener('pointerdown', listener);
    };
  }, [active]);
}
