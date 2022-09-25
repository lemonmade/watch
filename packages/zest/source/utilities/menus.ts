import {type KeyboardEvent} from 'react';
import {type Signal} from '@preact/signals-core';
import {
  createOptionalContext,
  createUseContextHook,
} from '@quilted/react-utilities';

export interface MenuController {
  id: string;
  focused: Signal<HTMLElement | undefined>;
  keypress(event: KeyboardEvent<HTMLElement>): void;
}

export const MenuControllerContext = createOptionalContext<MenuController>();
export const useMenuController = createUseContextHook(MenuControllerContext);
