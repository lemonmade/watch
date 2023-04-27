export interface Hooks {
  createElement(element: Element, ns?: string | null): void;
  setAttribute(
    element: Element,
    name: string,
    value: string,
    ns?: string | null,
  ): void;
  removeAttribute(element: Element, name: string, ns?: string | null): void;
  createText(text: Text, data: string): void;
  setText(text: Text, data: string): void;
  insertChild(parent: Element, node: Element | Text, index: number): void;
  removeChild(parent: Element, node: Element | Text, index: number): void;
  addListener(
    element: EventTarget,
    type: string,
    listener: <T = {}>(eventInit?: T) => boolean,
  ): void;
  removeListener(
    element: EventTarget,
    type: string,
    listener: <T = {}>(eventInit?: T) => boolean,
  ): void;
}

export const hooks: Partial<Hooks> = {};
