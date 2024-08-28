import type {JSX} from 'preact';
import type {Signal} from '@preact/signals-core';
import {createOptionalContext} from '@quilted/quilt/context';

export interface MenuController {
  id: string;
  focused: Signal<HTMLElement | undefined>;
  keypress: JSX.KeyboardEventHandler<HTMLElement>;
}

export const MenuControllerContext = createOptionalContext<MenuController>();
export const useMenuController = MenuControllerContext.use;
