export interface Adaptor {
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
  insert(parent: Element, node: Element | Text, before?: Element | Text): void;
  remove(parent: Element, node: Element | Text): void;
  setProperty(element: Element, name: string, value: any): void;
  addListener(
    element: EventTarget,
    type: string,
    // eslint-disable-next-line @typescript-eslint/ban-types
    listener: <T = {}>(eventInit?: T) => boolean,
  ): void;
  removeListener(
    element: EventTarget,
    type: string,
    // eslint-disable-next-line @typescript-eslint/ban-types
    listener: <T = {}>(eventInit?: T) => boolean,
  ): void;
}
