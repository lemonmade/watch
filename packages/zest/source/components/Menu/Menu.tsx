import type {ComponentChild, RenderableProps, JSX} from 'preact';
import {useMemo, useRef} from 'preact/hooks';
import {signal} from '@preact/signals-core';
import {classes} from '@lemon/css';

import {useUniqueId} from '../../shared/id.ts';
import {
  MenuControllerContext,
  type MenuController,
} from '../../shared/menus.ts';
import {findUniqueFocusable} from '../../shared/focus.ts';

import systemStyles from '../../system.module.css';

import styles from './Menu.module.css';

export interface MenuProps {
  id?: string;
  label?: ComponentChild;
  filter?: ComponentChild;
}

export function Menu({
  id: explicitId,
  label,
  filter,
  children,
}: RenderableProps<MenuProps>) {
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
            const focusable = findUniqueFocusable(element);

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
            const focusable = findUniqueFocusable(element);

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

  const menuProps: JSX.HTMLAttributes<HTMLDivElement> = {
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
