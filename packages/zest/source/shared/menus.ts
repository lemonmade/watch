import {type KeyboardEvent, type Context} from 'react';
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

export const MenuControllerContext: Context<MenuController | undefined> =
  createOptionalContext();
export const useMenuController = createUseContextHook(MenuControllerContext);
