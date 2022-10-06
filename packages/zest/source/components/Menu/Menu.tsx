import {
  useMemo,
  useRef,
  type ReactNode,
  type PropsWithChildren,
  type HTMLAttributes,
} from 'react';
import {signal} from '@preact/signals-core';
import {classes} from '@lemon/css';

import {useUniqueId} from '../../utilities/id';
import {
  MenuControllerContext,
  type MenuController,
} from '../../utilities/menus';
import {findFirstFocusable} from '../../utilities/focus';

import systemStyles from '../../system.module.css';

import styles from './Menu.module.css';

interface MenuProps {
  id?: string;
  label?: ReactNode;
  filter?: ReactNode;
}

export function Menu({
  id: explicitId,
  label,
  filter,
  children,
}: PropsWithChildren<MenuProps>) {
  const id = useUniqueId('Menu', explicitId);
  const internals = useRef<any>({});

  const menu = useMemo<MenuController>(() => {
    const focused = signal<HTMLElement | undefined>(undefined);

    return {
      id,
      focused,
      keypress(event) {
        if (event.key === 'Enter') {
          focused.value?.click();
        }

        if (event.key === 'ArrowDown') {
          let element: Element | null =
            focused.value?.nextElementSibling ??
            internals.current.menu.firstElementChild;

          while (element != null) {
            const focusable = findFirstFocusable(element);

            if (focusable) {
              focused.value = focusable;
              break;
            } else {
              element = element.nextElementSibling;
            }
          }

          event.preventDefault();
        }

        if (event.key === 'ArrowUp') {
          let element: Element | null =
            focused.value?.previousElementSibling ??
            internals.current.menu.lastElementChild;

          while (element != null) {
            const focusable = findFirstFocusable(element);

            if (focusable) {
              focused.value = focusable;
              break;
            } else {
              element = element.previousElementSibling;
            }
          }

          event.preventDefault();
        }
      },
    };
  }, [id]);

  const menuProps: HTMLAttributes<HTMLDivElement> = {
    role: filter ? 'combobox' : 'menu',
    'aria-activedescendant': menu.focused.value?.id,
  };

  const menuRef = (element: HTMLElement | null) => {
    internals.current.menu = element;
  };

  const nestedMenu = Boolean(filter || label);

  const content = nestedMenu ? (
    <>
      {label && <div className={styles.Label}>{label}</div>}
      {filter && <div className={styles.Filter}>{filter}</div>}
      <div ref={menuRef} {...menuProps}>
        {children}
      </div>
    </>
  ) : (
    children
  );

  return (
    <MenuControllerContext.Provider value={menu}>
      <div
        className={classes(
          systemStyles.resetOrientation,
          systemStyles.contentInlineSizeFill,
          systemStyles.inlineAlignmentStart,
          styles.Menu,
          Boolean(label) && styles.hasLabel,
        )}
        ref={nestedMenu ? undefined : menuRef}
        {...(nestedMenu ? undefined : menuProps)}
      >
        {content}
      </div>
    </MenuControllerContext.Provider>
  );
}
