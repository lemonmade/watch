import {hooks} from './hooks.ts';
import {LISTENERS} from './constants.ts';
import {fireEvent, dispatchEvent, EventPhase} from './Event.ts';
import type {Event} from './Event.ts';
import type {ChildNode} from './ChildNode.ts';

export interface EventListenerOptions {
  capture?: boolean;
}

export interface EventListener {
  (evt: Event): void;
}

export interface EventListenerObject {
  handleEvent(object: Event): void;
}

export type EventListenerOrEventListenerObject =
  | EventListener
  | EventListenerObject;

export class EventTarget {
  [LISTENERS]?: Map<
    string,
    Set<EventListenerOrEventListenerObject> & {proxy?: (event: any) => boolean}
  >;

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ) {
    if (listener == null) return;

    const capture = options === true || (options && options.capture === true);
    const key = type + (capture ? '@' : '');
    let listeners = this[LISTENERS];
    if (!listeners) {
      listeners = new Map();
      this[LISTENERS] = listeners;
    }
    let list = listeners.get(key);
    if (!list) {
      list = new Set();
      listeners.set(key, list);
    }
    if (list.proxy === undefined) {
      list.proxy = dispatchEvent.bind(this, type);
      hooks.addListener?.(this as any, type, list.proxy!);
    }
    list.add(listener);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ) {
    if (listener == null) return;

    const capture = options === true || (options && options.capture === true);
    const key = `${type}${capture}`;
    const listeners = this[LISTENERS];
    const list = listeners && listeners.get(key);
    if (list) {
      list.delete(listener);
      if (list.proxy !== undefined) {
        hooks.removeListener?.(this as any, type, list.proxy!);
        list.proxy = undefined;
      }
    }
  }

  // function isChildNode(node: EventTarget): node is ChildNode {
  //   return PARENT in node;
  // }

  dispatchEvent(event: Event) {
    const path: EventTarget[] = [];
    // instanceof here is just to keep TypeScript happy
    let target = this as unknown as ChildNode | null;
    while (target != null) {
      path.push(target);
      target = target.parentNode;
    }
    // while (target instanceof Node && (target = target.parentNode)) {
    //   path.push(target);
    // }
    event.target = this;
    event.srcElement = this;
    event.path = path;
    let defaultPrevented = false;
    for (let i = path.length; --i; ) {
      if (fireEvent(event, path[i]!, EventPhase.CAPTURING_PHASE)) {
        defaultPrevented = true;
      }
    }
    if (fireEvent(event, this, EventPhase.AT_TARGET)) {
      defaultPrevented = true;
    }
    for (let i = 1; i < path.length; i++) {
      if (fireEvent(event, path[i]!, EventPhase.BUBBLING_PHASE)) {
        defaultPrevented = true;
      }
    }
    return !defaultPrevented;
  }
}
