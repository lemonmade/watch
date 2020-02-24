import React, {useState, RefObject, useEffect, useRef} from 'react';
import {classes} from '@lemon/css';
import {ReactPropsFromRemoteComponentType} from '@remote-ui/react';
import styles from './ContextualMenu.css';

type Props = ReactPropsFromRemoteComponentType<
  typeof import('components').ContextualMenu
>;

export function ContextualMenu({actions}: Props) {
  const [active, setActive] = useState(false);
  const sheetRef = useRef<HTMLElement | null>(null);

  return (
    <>
      <div className={classes(styles.ContextualMenu, active && styles.active)}>
        <button
          className={styles.Action}
          type="button"
          onPointerUp={() => setActive((active) => !active)}
        >
          ...
        </button>
        <div className={styles.Sheet}>
          <ul className={styles.MenuActions}>
            {actions.map(({id, content, onPress}) => (
              <li key={id ?? content}>
                <button
                  type="button"
                  onPointerUp={onPress}
                  className={styles.MenuAction}
                >
                  {content}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {active && (
        <PressOutside elementRef={sheetRef} perform={() => setActive(false)} />
      )}
    </>
  );
}

function PressOutside<T extends HTMLElement>({
  elementRef,
  perform,
}: {
  elementRef: RefObject<T>;
  perform(): void;
}) {
  useEffect(() => {
    const listener = ({target}: PointerEvent) => {
      const {current: maybeAncestor} = elementRef;

      if (maybeAncestor == null) {
        perform();
      }

      let currentElement = target as HTMLElement | null;

      while (currentElement != null) {
        if (currentElement === maybeAncestor) {
          perform();
          return;
        }

        currentElement = currentElement.parentElement;
      }
    };

    document.addEventListener('pointerdown', listener);

    return () => {
      document.removeEventListener('pointerdown', listener);
    };
  }, [elementRef, perform]);

  return null;
}
